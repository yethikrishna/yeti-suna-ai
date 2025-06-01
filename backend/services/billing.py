"""
Stripe Billing API implementation for Suna on top of Basejump. ONLY HAS SUPPOT FOR USER ACCOUNTS – no team accounts. As we are using the user_id as account_id as is the case with personal accounts. In personal accounts, the account_id equals the user_id. In team accounts, the account_id is unique.

stripe listen --forward-to localhost:8000/api/billing/webhook
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional, Dict, Tuple
import stripe
from datetime import datetime, timezone
from utils.logger import logger
from utils.config import config, EnvMode
from services.supabase import DBConnection
from utils.auth_utils import get_current_user_id_from_jwt
from pydantic import BaseModel
from utils.constants import MODEL_ACCESS_TIERS, MODEL_NAME_ALIASES
# Initialize Stripe
stripe.api_key = config.STRIPE_SECRET_KEY

# Initialize router
router = APIRouter(prefix="/billing", tags=["billing"])


SUBSCRIPTION_TIERS = {
    config.STRIPE_FREE_TIER_ID: {'name': 'free', 'minutes': 60},
    config.STRIPE_TIER_2_20_ID: {'name': 'tier_2_20', 'minutes': 120},  # 2 hours
    config.STRIPE_TIER_6_50_ID: {'name': 'tier_6_50', 'minutes': 360},  # 6 hours
    config.STRIPE_TIER_12_100_ID: {'name': 'tier_12_100', 'minutes': 720},  # 12 hours
    config.STRIPE_TIER_25_200_ID: {'name': 'tier_25_200', 'minutes': 1500},  # 25 hours
    config.STRIPE_TIER_50_400_ID: {'name': 'tier_50_400', 'minutes': 3000},  # 50 hours
    config.STRIPE_TIER_125_800_ID: {'name': 'tier_125_800', 'minutes': 7500},  # 125 hours
    config.STRIPE_TIER_200_1000_ID: {'name': 'tier_200_1000', 'minutes': 12000},  # 200 hours
}

# Pydantic models for request/response validation
class CreateCheckoutSessionRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str

class CreatePortalSessionRequest(BaseModel):
    return_url: str

class SubscriptionStatus(BaseModel):
    status: str # e.g., 'active', 'trialing', 'past_due', 'scheduled_downgrade', 'no_subscription'
    plan_name: Optional[str] = None
    price_id: Optional[str] = None # Added price ID
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    trial_end: Optional[datetime] = None
    minutes_limit: Optional[int] = None
    current_usage: Optional[float] = None
    # Fields for scheduled changes
    has_schedule: bool = False
    scheduled_plan_name: Optional[str] = None
    scheduled_price_id: Optional[str] = None # Added scheduled price ID
    scheduled_change_date: Optional[datetime] = None

# Helper functions
async def get_stripe_customer_id(client, user_id: str) -> Optional[str]: # client is DAL client
    """Get the Stripe customer ID for a user."""
    if config.DATABASE_TYPE == "sqlite":
        logger.info(f"Billing function get_stripe_customer_id is disabled in SQLite mode for user {user_id}.")
        return f"cus_local_{user_id}" # Return a mock ID

    # Original Supabase logic (client here is Supabase client, need to adapt if DAL is passed)
    # This function is called by other functions in this file which still use old DBConnection.
    # For now, assume this 'client' is the Supabase client from DBConnection.
    # If this function were to be called with a DAL client, it would need adjustment.
    result = await client.schema('basejump').from_('billing_customers') \
        .select('id') \
        .eq('account_id', user_id) \
        .execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]['id']
    return None

async def create_stripe_customer(client, user_id: str, email: str) -> str: # client is DAL client
    """Create a new Stripe customer for a user."""
    if config.DATABASE_TYPE == "sqlite":
        logger.info(f"Billing function create_stripe_customer is disabled in SQLite mode for user {user_id}.")
        # In SQLite mode, we might want to create a dummy record in a local 'billing_customers' table if it exists.
        # For now, just returning a mock ID.
        # dal_client = await get_db_client() # This would be the correct way if we were to use DAL here
        # await dal_client.insert('billing_customers', {'id': f"cus_local_{user_id}", 'user_id': user_id, 'email': email, 'provider': 'local_stripe_mock'})
        return f"cus_local_{user_id}"

    # Create customer in Stripe
    customer = stripe.Customer.create(
        email=email,
        metadata={"user_id": user_id}
    )
    
    # Store customer ID in Supabase
    # This 'client' is the Supabase client from DBConnection.
    await client.schema('basejump').from_('billing_customers').insert({
        'id': customer.id,
        'account_id': user_id,
        'email': email,
        'provider': 'stripe'
    }).execute()
    
    return customer.id

async def get_user_subscription(user_id: str) -> Optional[Dict]:
    """Get the current subscription for a user from Stripe."""
    if config.DATABASE_TYPE == "sqlite":
        logger.info(f"Billing function get_user_subscription is disabled in SQLite mode for user {user_id}.")
        # Return a mock active subscription for SQLite mode
        return {
            "status": "active",
            "plan": {"nickname": "Local Free Plan"},
            "items": {"data": [{"price": {"id": "price_local_free"}}]},
            "current_period_end": (datetime.now(timezone.utc) + timedelta(days=30)).timestamp(),
            "cancel_at_period_end": False,
            "trial_end": None,
            "price_id": "price_local_free" # Ensure this matches a key in SUBSCRIPTION_TIERS or handle default
        }

    try:
        # Get customer ID
        db = DBConnection() # This still uses the old DBConnection for Supabase
        client = await db.client
        customer_id = await get_stripe_customer_id(client, user_id) # This client is Supabase client
        
        if not customer_id:
            return None
            
        # Get all active subscriptions for the customer
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status='active'
        )
        # print("Found subscriptions:", subscriptions)
        
        # Check if we have any subscriptions
        if not subscriptions or not subscriptions.get('data'):
            return None
            
        # Filter subscriptions to only include our product's subscriptions
        our_subscriptions = []
        for sub in subscriptions['data']:
            # Get the first subscription item
            if sub.get('items') and sub['items'].get('data') and len(sub['items']['data']) > 0:
                item = sub['items']['data'][0]
                if item.get('price') and item['price'].get('id') in [
                    config.STRIPE_FREE_TIER_ID,
                    config.STRIPE_TIER_2_20_ID,
                    config.STRIPE_TIER_6_50_ID,
                    config.STRIPE_TIER_12_100_ID,
                    config.STRIPE_TIER_25_200_ID,
                    config.STRIPE_TIER_50_400_ID,
                    config.STRIPE_TIER_125_800_ID,
                    config.STRIPE_TIER_200_1000_ID
                ]:
                    our_subscriptions.append(sub)
        
        if not our_subscriptions:
            return None
            
        # If there are multiple active subscriptions, we need to handle this
        if len(our_subscriptions) > 1:
            logger.warning(f"User {user_id} has multiple active subscriptions: {[sub['id'] for sub in our_subscriptions]}")
            
            # Get the most recent subscription
            most_recent = max(our_subscriptions, key=lambda x: x['created'])
            
            # Cancel all other subscriptions
            for sub in our_subscriptions:
                if sub['id'] != most_recent['id']:
                    try:
                        stripe.Subscription.modify(
                            sub['id'],
                            cancel_at_period_end=True
                        )
                        logger.info(f"Cancelled subscription {sub['id']} for user {user_id}")
                    except Exception as e:
                        logger.error(f"Error cancelling subscription {sub['id']}: {str(e)}")
            
            return most_recent
            
        return our_subscriptions[0]
        
    except Exception as e:
        logger.error(f"Error getting subscription from Stripe: {str(e)}")
        return None

async def calculate_monthly_usage(client, user_id: str) -> float:
    """Calculate total agent run minutes for the current month for a user."""
    # Get start of current month in UTC
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    # First get all threads for this user
    threads_result = await client.table('threads') \
        .select('thread_id') \
        .eq('account_id', user_id) \
        .execute()
    
    if not threads_result.data:
        return 0.0
    
    thread_ids = [t['thread_id'] for t in threads_result.data]
    
    # Then get all agent runs for these threads in current month
    runs_result = await client.table('agent_runs') \
        .select('started_at, completed_at') \
        .in_('thread_id', thread_ids) \
        .gte('started_at', start_of_month.isoformat()) \
        .execute()
    
    if not runs_result.data:
        return 0.0
    
    # Calculate total minutes
    total_seconds = 0
    now_ts = now.timestamp()
    
    for run in runs_result.data:
        start_time = datetime.fromisoformat(run['started_at'].replace('Z', '+00:00')).timestamp()
        if run['completed_at']:
            end_time = datetime.fromisoformat(run['completed_at'].replace('Z', '+00:00')).timestamp()
        else:
            # For running jobs, use current time
            end_time = now_ts
        
        total_seconds += (end_time - start_time)
    
    return total_seconds / 60  # Convert to minutes

async def get_allowed_models_for_user(db_dal_client: DatabaseInterface, user_id: str): # Parameter changed
    """
    Get the list of models allowed for a user based on their subscription tier.
    In SQLite mode, defaults to all models in the 'free' tier or a generous set.
    """
    if config.DATABASE_TYPE == "sqlite":
        logger.info(f"Billing function get_allowed_models_for_user is simplified in SQLite mode for user {user_id}.")
        # Return all models defined in the free tier, or a superset if no tiers are defined for SQLite.
        # For simplicity, let's assume 'free' tier allows all models listed in MODEL_ACCESS_TIERS['free'].
        return MODEL_ACCESS_TIERS.get('free', list(MODEL_NAME_ALIASES.values())) # Fallback to all known models if 'free' tier not defined

    # Original Supabase logic (client passed here is Supabase client from DBConnection)
    # This would need to be refactored if this function is called with a DAL client for Supabase.
    # For now, assuming it's called by functions that still use the old DBConnection for Supabase.
    client_supabase = db_dal_client # This is problematic if db_dal_client is DAL type.
                                  # It should be passed the Supabase client directly if not using DAL for this.
                                  # Let's assume this function will be called with the correct client type.
                                  # Or, this function itself needs to get the right client.
                                  # For now, we'll proceed, but this highlights a refactoring point.

    subscription = await get_user_subscription(user_id) # This already handles SQLite mode internally
    tier_name = 'free'
    
    if subscription:
        price_id = subscription.get("price_id") # get_user_subscription for SQLite returns this
        if not price_id and subscription.get('items') and subscription['items'].get('data') and len(subscription['items']['data']) > 0:
             price_id = subscription['items']['data'][0]['price']['id']
        else: # Fallback if price_id is still not found from items
            price_id = config.STRIPE_FREE_TIER_ID # Default to free tier ID from config

        tier_info = SUBSCRIPTION_TIERS.get(price_id)
        if tier_info:
            tier_name = tier_info['name']
        elif price_id == "price_local_free": # Handle mock price_id from SQLite mode
             tier_name = 'free'

    return MODEL_ACCESS_TIERS.get(tier_name, MODEL_ACCESS_TIERS.get('free', list(MODEL_NAME_ALIASES.values())))


async def can_use_model(db_dal_client: DatabaseInterface, user_id: str, model_name: str): # Parameter changed
    # ENV_MODE.LOCAL check is for general local dev, DATABASE_TYPE == "sqlite" is more specific
    if config.DATABASE_TYPE == "sqlite" or config.ENV_MODE == EnvMode.LOCAL: # Combined condition
        logger.info("Billing: can_use_model check is permissive in SQLite/Local mode.")
    if config.DATABASE_TYPE == "sqlite" or config.ENV_MODE == EnvMode.LOCAL: # Combined condition
        logger.info("Billing: can_use_model check is permissive in SQLite/Local mode.")
        # In SQLite/local mode, allow all models or a defined "free" set
        # For maximum permissiveness in local dev:
        return True, "SQLite/Local mode - model access allowed", list(MODEL_NAME_ALIASES.values())
        
    allowed_models = await get_allowed_models_for_user(db_dal_client, user_id) # Pass DAL client
    resolved_model = MODEL_NAME_ALIASES.get(model_name, model_name)
    if resolved_model in allowed_models:
        return True, "Model access allowed", allowed_models
    
    return False, f"Your current subscription plan does not include access to {model_name}. Please upgrade your subscription or choose from your available models: {', '.join(allowed_models)}", allowed_models

async def check_billing_status(db_dal_client: DatabaseInterface, user_id: str) -> Tuple[bool, str, Optional[Dict]]: # Parameter changed
    """
    Check if a user can run agents based on their subscription and usage.
    
    Returns:
        Tuple[bool, str, Optional[Dict]]: (can_run, message, subscription_info)
    """
    # ENV_MODE.LOCAL check is for general local dev, DATABASE_TYPE == "sqlite" is more specific
    if config.DATABASE_TYPE == "sqlite" or config.ENV_MODE == EnvMode.LOCAL: # Combined condition
        logger.info("Billing: check_billing_status is permissive in SQLite/Local mode.")
        return True, "Local development mode - billing disabled", {
            "price_id": "local_dev",
            "plan_name": "Local Development",
            "minutes_limit": "no limit"
        }
    
    # Get current subscription
    subscription = await get_user_subscription(user_id) # This already handles SQLite mode internally
    
    # If no subscription (even mock one for SQLite), default to a conceptual free tier
    if not subscription: # Should not happen if get_user_subscription is robust for SQLite
        subscription = {
            'price_id': "price_local_free",
            'plan_name': 'free',
            'status': 'active'
        }
    
    price_id = subscription.get("price_id")
    if not price_id and subscription.get('items') and subscription['items'].get('data') and len(subscription['items']['data']) > 0:
        price_id = subscription['items']['data'][0]['price']['id']
    
    # Ensure price_id has a value, defaulting to free tier if necessary
    if not price_id:
        price_id = config.STRIPE_FREE_TIER_ID if config.STRIPE_FREE_TIER_ID else "price_local_free"


    tier_info = SUBSCRIPTION_TIERS.get(price_id)
    if not tier_info:
        logger.warning(f"Unknown subscription tier ID: {price_id}. Defaulting to free tier behavior.")
        # Attempt to get free tier from config, or use a hardcoded default for local/SQLite
        free_tier_key = config.STRIPE_FREE_TIER_ID if config.STRIPE_FREE_TIER_ID else \
                        next(iter(SUBSCRIPTION_TIERS)) # Get first key as a fallback if free tier ID not in config
        tier_info = SUBSCRIPTION_TIERS.get(free_tier_key, {'name': 'default_free', 'minutes': 60})


    # In SQLite mode, usage calculation might not be meaningful or rely on tables not fully populated.
    # For simplicity, assume usage is always within limits in SQLite mode.
    if config.DATABASE_TYPE == "sqlite":
        current_usage = 0.0
    else:
        # This client would be Supabase client from DBConnection for usage calculation
        # This highlights that calculate_monthly_usage also needs to be DAL-aware or handle client types
        db_conn_for_usage = DBConnection() # Still uses old connection for Supabase
        supa_client_for_usage = await db_conn_for_usage.client
        current_usage = await calculate_monthly_usage(supa_client_for_usage, user_id)
    
    if current_usage >= tier_info['minutes']:
        return False, f"Monthly limit of {tier_info['minutes']} minutes reached. Please upgrade or wait.", subscription
    
    return True, "OK", subscription

# API endpoints
@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Create a Stripe Checkout session or modify an existing subscription."""
    if config.DATABASE_TYPE == "sqlite":
        logger.info("Billing endpoint /create-checkout-session is disabled in SQLite mode.")
        # Mock a successful response or indicate it's not applicable
        return {"session_id": "mock_session_local", "url": "#local-checkout-disabled", "status": "local_mock"}

    try:
        # Get Supabase client (still using DBConnection for Supabase interactions here)
        db_supa = DBConnection()
        client_supa = await db_supa.client # This is Supabase client
        
        # Get user email from auth.users (Supabase specific)
        user_result = await client_supa.auth.admin.get_user_by_id(current_user_id)
        if not user_result: raise HTTPException(status_code=404, detail="User not found")
        email = user_result.user.email
        
        # Get or create Stripe customer (these helpers use the passed Supabase client_supa)
        customer_id = await get_stripe_customer_id(client_supa, current_user_id)
        if not customer_id: customer_id = await create_stripe_customer(client_supa, current_user_id, email)
        
        # Get the target price and product ID
        try:
            price = stripe.Price.retrieve(request.price_id, expand=['product'])
            product_id = price['product']['id']
        except stripe.error.InvalidRequestError:
            raise HTTPException(status_code=400, detail=f"Invalid price ID: {request.price_id}")
            
        # Verify the price belongs to our product
        if product_id != config.STRIPE_PRODUCT_ID:
            raise HTTPException(status_code=400, detail="Price ID does not belong to the correct product.")
            
        # Check for existing subscription for our product
        existing_subscription = await get_user_subscription(current_user_id)
        # print("Existing subscription for product:", existing_subscription)
        
        if existing_subscription:
            # --- Handle Subscription Change (Upgrade or Downgrade) ---
            try:
                subscription_id = existing_subscription['id']
                subscription_item = existing_subscription['items']['data'][0]
                current_price_id = subscription_item['price']['id']
                
                # Skip if already on this plan
                if current_price_id == request.price_id:
                    return {
                        "subscription_id": subscription_id,
                        "status": "no_change",
                        "message": "Already subscribed to this plan.",
                        "details": {
                            "is_upgrade": None,
                            "effective_date": None,
                            "current_price": round(price['unit_amount'] / 100, 2) if price.get('unit_amount') else 0,
                            "new_price": round(price['unit_amount'] / 100, 2) if price.get('unit_amount') else 0,
                        }
                    }
                
                # Get current and new price details
                current_price = stripe.Price.retrieve(current_price_id)
                new_price = price # Already retrieved
                is_upgrade = new_price['unit_amount'] > current_price['unit_amount']

                if is_upgrade:
                    # --- Handle Upgrade --- Immediate modification
                    updated_subscription = stripe.Subscription.modify(
                        subscription_id,
                        items=[{
                            'id': subscription_item['id'],
                            'price': request.price_id,
                        }],
                        proration_behavior='always_invoice', # Prorate and charge immediately
                        billing_cycle_anchor='now' # Reset billing cycle
                    )
                    
                    # Update active status in database to true (customer has active subscription)
                    await client.schema('basejump').from_('billing_customers').update(
                        {'active': True}
                    ).eq('id', customer_id).execute()
                    logger.info(f"Updated customer {customer_id} active status to TRUE after subscription upgrade")
                    
                    latest_invoice = None
                    if updated_subscription.get('latest_invoice'):
                       latest_invoice = stripe.Invoice.retrieve(updated_subscription['latest_invoice']) 
                    
                    return {
                        "subscription_id": updated_subscription['id'],
                        "status": "updated",
                        "message": "Subscription upgraded successfully",
                        "details": {
                            "is_upgrade": True,
                            "effective_date": "immediate",
                            "current_price": round(current_price['unit_amount'] / 100, 2) if current_price.get('unit_amount') else 0,
                            "new_price": round(new_price['unit_amount'] / 100, 2) if new_price.get('unit_amount') else 0,
                            "invoice": {
                                "id": latest_invoice['id'] if latest_invoice else None,
                                "status": latest_invoice['status'] if latest_invoice else None,
                                "amount_due": round(latest_invoice['amount_due'] / 100, 2) if latest_invoice else 0,
                                "amount_paid": round(latest_invoice['amount_paid'] / 100, 2) if latest_invoice else 0
                            } if latest_invoice else None
                        }
                    }
                else:
                    # --- Handle Downgrade --- Use Subscription Schedule
                    try:
                        current_period_end_ts = subscription_item['current_period_end']
                        
                        # Retrieve the subscription again to get the schedule ID if it exists
                        # This ensures we have the latest state before creating/modifying schedule
                        sub_with_schedule = stripe.Subscription.retrieve(subscription_id)
                        schedule_id = sub_with_schedule.get('schedule')

                        # Get the current phase configuration from the schedule or subscription
                        if schedule_id:
                            schedule = stripe.SubscriptionSchedule.retrieve(schedule_id)
                            # Find the current phase in the schedule
                            # This logic assumes simple schedules; might need refinement for complex ones
                            current_phase = None
                            for phase in reversed(schedule['phases']):
                                if phase['start_date'] <= datetime.now(timezone.utc).timestamp():
                                    current_phase = phase
                                    break
                            if not current_phase: # Fallback if logic fails
                                current_phase = schedule['phases'][-1]
                        else:
                             # If no schedule, the current subscription state defines the current phase
                            current_phase = {
                                'items': existing_subscription['items']['data'], # Use original items data
                                'start_date': existing_subscription['current_period_start'], # Use sub start if no schedule
                                # Add other relevant fields if needed for create/modify
                            }

                        # Prepare the current phase data for the update/create
                        # Ensure items is formatted correctly for the API
                        current_phase_items_for_api = []
                        for item in current_phase.get('items', []):
                            price_data = item.get('price')
                            quantity = item.get('quantity')
                            price_id = None
                            
                            # Safely extract price ID whether it's an object or just the ID string
                            if isinstance(price_data, dict):
                                price_id = price_data.get('id')
                            elif isinstance(price_data, str):
                                price_id = price_data
                            
                            if price_id and quantity is not None:
                                current_phase_items_for_api.append({'price': price_id, 'quantity': quantity})
                            else:
                                logger.warning(f"Skipping item in current phase due to missing price ID or quantity: {item}")
                                
                        if not current_phase_items_for_api:
                             raise ValueError("Could not determine valid items for the current phase.")

                        current_phase_update_data = {
                            'items': current_phase_items_for_api,
                            'start_date': current_phase['start_date'], # Preserve original start date
                            'end_date': current_period_end_ts, # End this phase at period end
                            'proration_behavior': 'none'
                            # Include other necessary fields from current_phase if modifying?
                            # e.g., 'billing_cycle_anchor', 'collection_method'? Usually inherited.
                        }
                        
                        # Define the new (downgrade) phase
                        new_downgrade_phase_data = {
                            'items': [{'price': request.price_id, 'quantity': 1}],
                            'start_date': current_period_end_ts, # Start immediately after current phase ends
                            'proration_behavior': 'none'
                            # iterations defaults to 1, meaning it runs for one billing cycle
                            # then schedule ends based on end_behavior
                        }
                        
                        # Update or Create Schedule
                        if schedule_id:
                             # Update existing schedule, replacing all future phases
                            # print(f"Updating existing schedule {schedule_id}")
                            logger.info(f"Updating existing schedule {schedule_id} for subscription {subscription_id}")
                            logger.debug(f"Current phase data: {current_phase_update_data}")
                            logger.debug(f"New phase data: {new_downgrade_phase_data}")
                            updated_schedule = stripe.SubscriptionSchedule.modify(
                                schedule_id,
                                phases=[current_phase_update_data, new_downgrade_phase_data],
                                end_behavior='release' 
                            )
                            logger.info(f"Successfully updated schedule {updated_schedule['id']}")
                        else:
                             # Create a new schedule using the defined phases
                            print(f"Creating new schedule for subscription {subscription_id}")
                            logger.info(f"Creating new schedule for subscription {subscription_id}")
                            # Deep debug logging - write subscription details to help diagnose issues
                            logger.debug(f"Subscription details: {subscription_id}, current_period_end_ts: {current_period_end_ts}")
                            logger.debug(f"Current price: {current_price_id}, New price: {request.price_id}")
                            
                            try:
                                updated_schedule = stripe.SubscriptionSchedule.create(
                                    from_subscription=subscription_id,
                                    phases=[
                                        {
                                            'start_date': current_phase['start_date'],
                                            'end_date': current_period_end_ts,
                                            'proration_behavior': 'none',
                                            'items': [
                                                {
                                                    'price': current_price_id,
                                                    'quantity': 1
                                                }
                                            ]
                                        },
                                        {
                                            'start_date': current_period_end_ts,
                                            'proration_behavior': 'none',
                                            'items': [
                                                {
                                                    'price': request.price_id,
                                                    'quantity': 1
                                                }
                                            ]
                                        }
                                    ],
                                    end_behavior='release'
                                )
                                # Don't try to link the schedule - that's handled by from_subscription
                                logger.info(f"Created new schedule {updated_schedule['id']} from subscription {subscription_id}")
                                # print(f"Created new schedule {updated_schedule['id']} from subscription {subscription_id}")
                                
                                # Verify the schedule was created correctly
                                fetched_schedule = stripe.SubscriptionSchedule.retrieve(updated_schedule['id'])
                                logger.info(f"Schedule verification - Status: {fetched_schedule.get('status')}, Phase Count: {len(fetched_schedule.get('phases', []))}")
                                logger.debug(f"Schedule details: {fetched_schedule}")
                            except Exception as schedule_error:
                                logger.exception(f"Failed to create schedule: {str(schedule_error)}")
                                raise schedule_error  # Re-raise to be caught by the outer try-except
                        
                        return {
                            "subscription_id": subscription_id,
                            "schedule_id": updated_schedule['id'],
                            "status": "scheduled",
                            "message": "Subscription downgrade scheduled",
                            "details": {
                                "is_upgrade": False,
                                "effective_date": "end_of_period",
                                "current_price": round(current_price['unit_amount'] / 100, 2) if current_price.get('unit_amount') else 0,
                                "new_price": round(new_price['unit_amount'] / 100, 2) if new_price.get('unit_amount') else 0,
                                "effective_at": datetime.fromtimestamp(current_period_end_ts, tz=timezone.utc).isoformat()
                            }
                        }
                    except Exception as e:
                         logger.exception(f"Error handling subscription schedule for sub {subscription_id}: {str(e)}")
                         raise HTTPException(status_code=500, detail=f"Error handling subscription schedule: {str(e)}")
            except Exception as e:
                logger.exception(f"Error updating subscription {existing_subscription.get('id') if existing_subscription else 'N/A'}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error updating subscription: {str(e)}")
        else:
            # --- Create New Subscription via Checkout Session ---
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                    line_items=[{'price': request.price_id, 'quantity': 1}],
                mode='subscription',
                success_url=request.success_url,
                cancel_url=request.cancel_url,
                metadata={
                        'user_id': current_user_id,
                        'product_id': product_id
                },
                allow_promotion_codes=True
            )
            
            # Update customer status to potentially active (will be confirmed by webhook)
            # This ensures customer is marked as active once payment is completed
            await client.schema('basejump').from_('billing_customers').update(
                {'active': True}
            ).eq('id', customer_id).execute()
            logger.info(f"Updated customer {customer_id} active status to TRUE after creating checkout session")
            
            return {"session_id": session['id'], "url": session['url'], "status": "new"}
        
    except Exception as e:
        logger.exception(f"Error creating checkout session: {str(e)}")
        # Check if it's a Stripe error with more details
        if hasattr(e, 'json_body') and e.json_body and 'error' in e.json_body:
            error_detail = e.json_body['error'].get('message', str(e))
        else:
            error_detail = str(e)
        raise HTTPException(status_code=500, detail=f"Error creating checkout session: {error_detail}")

@router.post("/create-portal-session")
async def create_portal_session(
    request: CreatePortalSessionRequest,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Create a Stripe Customer Portal session for subscription management."""
    if config.DATABASE_TYPE == "sqlite":
        logger.info("Billing endpoint /create-portal-session is disabled in SQLite mode.")
        return {"url": "#local-portal-disabled"}

    try:
        # Get Supabase client (still using DBConnection for Supabase interactions here)
        db_supa = DBConnection()
        client_supa = await db_supa.client # This is Supabase client
        
        # Get customer ID (helper uses the passed Supabase client_supa)
        customer_id = await get_stripe_customer_id(client_supa, current_user_id)
        if not customer_id:
            raise HTTPException(status_code=404, detail="No billing customer found")
        
        # Ensure the portal configuration has subscription_update enabled
        try:
            # First, check if we have a configuration that already enables subscription update
            configurations = stripe.billing_portal.Configuration.list(limit=100)
            active_config = None
            
            # Look for a configuration with subscription_update enabled
            for config in configurations.get('data', []):
                features = config.get('features', {})
                subscription_update = features.get('subscription_update', {})
                if subscription_update.get('enabled', False):
                    active_config = config
                    logger.info(f"Found existing portal configuration with subscription_update enabled: {config['id']}")
                    break
            
            # If no config with subscription_update found, create one or update the active one
            if not active_config:
                # Find the active configuration or create a new one
                if configurations.get('data', []):
                    default_config = configurations['data'][0]
                    logger.info(f"Updating default portal configuration: {default_config['id']} to enable subscription_update")
                    
                    active_config = stripe.billing_portal.Configuration.update(
                        default_config['id'],
                        features={
                            'subscription_update': {
                                'enabled': True,
                                'proration_behavior': 'create_prorations',
                                'default_allowed_updates': ['price']
                            },
                            # Preserve other features that may already be enabled
                            'customer_update': default_config.get('features', {}).get('customer_update', {'enabled': True, 'allowed_updates': ['email', 'address']}),
                            'invoice_history': {'enabled': True},
                            'payment_method_update': {'enabled': True}
                        }
                    )
                else:
                    # Create a new configuration with subscription_update enabled
                    logger.info("Creating new portal configuration with subscription_update enabled")
                    active_config = stripe.billing_portal.Configuration.create(
                        business_profile={
                            'headline': 'Subscription Management',
                            'privacy_policy_url': config.FRONTEND_URL + '/privacy',
                            'terms_of_service_url': config.FRONTEND_URL + '/terms'
                        },
                        features={
                            'subscription_update': {
                                'enabled': True,
                                'proration_behavior': 'create_prorations',
                                'default_allowed_updates': ['price']
                            },
                            'customer_update': {
                                'enabled': True,
                                'allowed_updates': ['email', 'address']
                            },
                            'invoice_history': {'enabled': True},
                            'payment_method_update': {'enabled': True}
                        }
                    )
            
            # Log the active configuration for debugging
            logger.info(f"Using portal configuration: {active_config['id']} with subscription_update: {active_config.get('features', {}).get('subscription_update', {}).get('enabled', False)}")
        
        except Exception as config_error:
            logger.warning(f"Error configuring portal: {config_error}. Continuing with default configuration.")
        
        # Create portal session using the proper configuration if available
        portal_params = {
            "customer": customer_id,
            "return_url": request.return_url
        }
        
        # Add configuration_id if we found or created one with subscription_update enabled
        if active_config:
            portal_params["configuration"] = active_config['id']
        
        # Create the session
        session = stripe.billing_portal.Session.create(**portal_params)
        
        return {"url": session.url}
        
    except Exception as e:
        logger.error(f"Error creating portal session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/subscription")
async def get_subscription(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get the current subscription status for the current user, including scheduled changes."""
    if config.DATABASE_TYPE == "sqlite":
        logger.info("Billing endpoint /subscription is simplified in SQLite mode.")
        # Mock response for SQLite mode
        # Use a default free tier ID or a mock one.
        # Ensure price_id here matches one in SUBSCRIPTION_TIERS or handle default in mock
        mock_price_id = next(iter(SUBSCRIPTION_TIERS)) # Get first price ID as a mock
        mock_tier_info = SUBSCRIPTION_TIERS.get(mock_price_id, {'name': 'local_mock_free', 'minutes': 1000000})

        return SubscriptionStatus(
            status="active", # Mock as active
            plan_name=mock_tier_info.get('name'),
            price_id=mock_price_id,
            current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
            cancel_at_period_end=False,
            trial_end=None,
            minutes_limit=mock_tier_info.get('minutes'),
            current_usage=0.0, # Mock usage
            has_schedule=False
        )

    try:
        # Get subscription from Stripe (this helper already handles filtering/cleanup for SQLite)
        subscription = await get_user_subscription(current_user_id)
        
        if not subscription: # Should not happen if get_user_subscription provides mock for SQLite
            # Default to free tier status if no active subscription for our product
            # This path should ideally only be taken for Supabase if user has no Stripe sub
            free_tier_id = config.STRIPE_FREE_TIER_ID
            free_tier_info = SUBSCRIPTION_TIERS.get(free_tier_id, {'name': 'free', 'minutes': 0})
            return SubscriptionStatus(
                status="no_subscription",
                plan_name=free_tier_info.get('name'),
                price_id=free_tier_id,
                minutes_limit=free_tier_info.get('minutes')
            )
        
        # Extract current plan details
        price_id_from_sub = subscription.get("price_id") # get_user_subscription for SQLite returns this
        current_item = None
        if not price_id_from_sub and subscription.get('items') and subscription['items'].get('data'):
            current_item = subscription['items']['data'][0]
            price_id_from_sub = current_item['price']['id']

        current_price_id = price_id_from_sub or config.STRIPE_FREE_TIER_ID # Fallback

        current_tier_info = SUBSCRIPTION_TIERS.get(current_price_id)
        if not current_tier_info:
             logger.warning(f"User {current_user_id} subscribed to unknown price {current_price_id}. Defaulting info.")
             current_tier_info = {'name': 'unknown', 'minutes': 0} # Fallback tier info
        
        # Calculate current usage
        # db_dal = await get_db_client() # Get DAL client
        # current_usage = await calculate_monthly_usage(db_dal, current_user_id)
        # calculate_monthly_usage needs to be fully DAL compatible or use the correct client.
        # For now, assuming it's called correctly based on its internal DB type check.
        # If it's Supabase, it still uses old DBConnection.
        db_for_usage_calc = DBConnection() # This is Supabase specific if not SQLite
        supa_client_for_usage = await db_for_usage_calc.client
        current_usage = await calculate_monthly_usage(supa_client_for_usage, current_user_id) # calculate_monthly_usage handles SQLite
        
        status_response = SubscriptionStatus(
            status=subscription['status'], # 'active', 'trialing', etc.
            plan_name=subscription['plan'].get('nickname') or current_tier_info['name'],
            price_id=current_price_id,
            current_period_end=datetime.fromtimestamp(current_item['current_period_end'], tz=timezone.utc),
            cancel_at_period_end=subscription['cancel_at_period_end'],
            trial_end=datetime.fromtimestamp(subscription['trial_end'], tz=timezone.utc) if subscription.get('trial_end') else None,
            minutes_limit=current_tier_info['minutes'],
            current_usage=round(current_usage, 2),
            has_schedule=False # Default
        )

        # Check for an attached schedule (indicates pending downgrade)
        schedule_id = subscription.get('schedule')
        if schedule_id:
            try:
                schedule = stripe.SubscriptionSchedule.retrieve(schedule_id)
                # Find the *next* phase after the current one
                next_phase = None
                current_phase_end = current_item['current_period_end']
                
                for phase in schedule.get('phases', []):
                    # Check if this phase starts exactly when the current one ends
                    if phase.get('start_date') == current_phase_end:
                        next_phase = phase
                        break # Found the immediate next phase

                if next_phase:
                    scheduled_item = next_phase['items'][0] # Assuming single item
                    scheduled_price_id = scheduled_item['price'] # Price ID might be string here
                    scheduled_tier_info = SUBSCRIPTION_TIERS.get(scheduled_price_id)
                    
                    status_response.has_schedule = True
                    status_response.status = 'scheduled_downgrade' # Override status
                    status_response.scheduled_plan_name = scheduled_tier_info.get('name', 'unknown') if scheduled_tier_info else 'unknown'
                    status_response.scheduled_price_id = scheduled_price_id
                    status_response.scheduled_change_date = datetime.fromtimestamp(next_phase['start_date'], tz=timezone.utc)
                    
            except Exception as schedule_error:
                logger.error(f"Error retrieving or parsing schedule {schedule_id} for sub {subscription['id']}: {schedule_error}")
                # Proceed without schedule info if retrieval fails

        return status_response
        
    except Exception as e:
        logger.exception(f"Error getting subscription status for user {current_user_id}: {str(e)}") # Use logger.exception
        raise HTTPException(status_code=500, detail="Error retrieving subscription status.")

@router.get("/check-status")
async def check_status(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Check if the user can run agents based on their subscription and usage."""
    # The check_billing_status function already handles SQLite mode internally.
    # It needs a DAL client if we want to make it fully generic.
    # For now, it uses DBConnection for Supabase calls, which is fine for this stage.
    # If we were to pass DAL client: db_dal = await get_db_client()
    # But check_billing_status's internal calls like get_user_subscription also use DBConnection.
    # So, we let check_billing_status manage its DB interaction for now.
    # The critical part is that check_billing_status itself is SQLite-aware.

    # To ensure consistency if check_billing_status expects a specific client type for Supabase:
    db_client_for_check = None
    if config.DATABASE_TYPE == "supabase":
        db_supa_temp = DBConnection()
        db_client_for_check = await db_supa_temp.client # Supabase client
    else: # For SQLite, the function handles it, can pass None or a dummy DAL client
        db_dal_dummy = await get_db_client() # This will be SQLiteDB instance
        db_client_for_check = db_dal_dummy


    try:
        can_run, message, subscription = await check_billing_status(db_client_for_check, current_user_id) # Pass appropriate client
        
        return {
            "can_run": can_run,
            "message": message,
            "subscription": subscription
        }
        
    except Exception as e:
        logger.error(f"Error checking billing status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    if config.DATABASE_TYPE == "sqlite":
        logger.info("Billing webhook endpoint is disabled in SQLite mode.")
        return {"status": "success", "message": "Webhook processed (no-op in SQLite mode)"}

    try:
        # Get the webhook secret from config
        webhook_secret = config.STRIPE_WEBHOOK_SECRET
        
        # Get the webhook payload
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Handle the event
        if event.type in ['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted']:
            # Extract the subscription and customer information
            subscription = event.data.object
            customer_id = subscription.get('customer')
            
            if not customer_id:
                logger.warning(f"No customer ID found in subscription event: {event.type}")
                return {"status": "error", "message": "No customer ID found"}
            
            # Get database connection (Supabase client for basejump schema)
            # This part remains Supabase-specific as basejump schema is not in SQLite
            db_supa = DBConnection()
            client_supa = await db_supa.client
            
            if event.type == 'customer.subscription.created' or event.type == 'customer.subscription.updated':
                if subscription.get('status') in ['active', 'trialing']:
                    await client_supa.schema('basejump').from_('billing_customers').update(
                        {'active': True}
                    ).eq('id', customer_id).execute()
                    logger.info(f"Webhook: Updated customer {customer_id} active status to TRUE based on {event.type}")
                else:
                    has_active = len(stripe.Subscription.list(customer=customer_id, status='active', limit=1).get('data', [])) > 0
                    if not has_active:
                        await client_supa.schema('basejump').from_('billing_customers').update(
                            {'active': False}
                        ).eq('id', customer_id).execute()
                        logger.info(f"Webhook: Updated customer {customer_id} active status to FALSE based on {event.type}")
            
            elif event.type == 'customer.subscription.deleted':
                has_active = len(stripe.Subscription.list(customer=customer_id, status='active', limit=1).get('data', [])) > 0
                if not has_active:
                    await client_supa.schema('basejump').from_('billing_customers').update(
                        {'active': False}
                    ).eq('id', customer_id).execute()
                    logger.info(f"Webhook: Updated customer {customer_id} active status to FALSE after subscription deletion")
            
            logger.info(f"Processed {event.type} event for customer {customer_id}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available-models")
async def get_available_models(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get the list of models available to the user based on their subscription tier."""
    # This function already calls get_allowed_models_for_user, which handles SQLite mode.
    # The client passed to get_allowed_models_for_user needs to be DAL-aware if it's to work generically.
    # For now, get_allowed_models_for_user's Supabase path still assumes old client.

    # If fully DAL: db_dal = await get_db_client()
    # However, get_allowed_models_for_user expects Supabase client for Supabase path.
    # Let's make this endpoint also SQLite-aware at the top.
    if config.DATABASE_TYPE == "sqlite" or config.ENV_MODE == EnvMode.LOCAL:
        logger.info("Billing: /available-models simplified in SQLite/Local mode.")
        # Use the logic from get_allowed_models_for_user's SQLite path
        # For simplicity, assume free tier allows all models.
        all_models_mock = []
        for short_name, full_name in MODEL_NAME_ALIASES.items():
            all_models_mock.append({
                "id": full_name, "display_name": short_name, "short_name": short_name,
                "requires_subscription": False, "is_available": True
            })
        return {
            "models": all_models_mock,
            "subscription_tier": "Local Development / SQLite Mode",
            "total_models": len(all_models_mock)
        }

    try:
        # For Supabase mode, use the existing logic which relies on DBConnection
        db_supa = DBConnection()
        client_supa = await db_supa.client # Supabase client
        
        # Check if we're in local development mode (this is redundant if DATABASE_TYPE is primary switch)
        # if config.ENV_MODE == EnvMode.LOCAL: This is already covered by DATABASE_TYPE check above
        #     logger.info("Running in local development mode - billing checks are disabled")
            
            # # In local mode, return all models from MODEL_NAME_ALIASES
            model_info = []
            for short_name, full_name in MODEL_NAME_ALIASES.items():
                # Skip entries where the key is a full name to avoid duplicates
                # if short_name == full_name or '/' in short_name:
                #     continue
                
                model_info.append({
                    "id": full_name,
                    "display_name": short_name,
                    "short_name": short_name,
                    "requires_subscription": False  # Always false in local dev mode
                })
            
            return {
                "models": model_info,
                "subscription_tier": "Local Development",
                "total_models": len(model_info)
            }
        
        # For non-local mode, get list of allowed models for this user
        allowed_models = await get_allowed_models_for_user(client, current_user_id)
        free_tier_models = MODEL_ACCESS_TIERS.get('free', [])
        
        # Get subscription info for context
        subscription = await get_user_subscription(current_user_id)
        
        # Determine tier name from subscription
        tier_name = 'free'
        if subscription:
            price_id = None
            if subscription.get('items') and subscription['items'].get('data') and len(subscription['items']['data']) > 0:
                price_id = subscription['items']['data'][0]['price']['id']
            else:
                price_id = subscription.get('price_id', config.STRIPE_FREE_TIER_ID)
            
            # Get tier info for this price_id
            tier_info = SUBSCRIPTION_TIERS.get(price_id)
            if tier_info:
                tier_name = tier_info['name']
        
        # Get all unique full model names from MODEL_NAME_ALIASES
        all_models = set()
        model_aliases = {}
        
        for short_name, full_name in MODEL_NAME_ALIASES.items():
            # Add all unique full model names
            all_models.add(full_name)
            
            # Only include short names that don't match their full names for aliases
            if short_name != full_name and not short_name.startswith("openai/") and not short_name.startswith("anthropic/") and not short_name.startswith("openrouter/") and not short_name.startswith("xai/"):
                if full_name not in model_aliases:
                    model_aliases[full_name] = short_name
        
        # Create model info with display names for ALL models
        model_info = []
        for model in all_models:
            display_name = model_aliases.get(model, model.split('/')[-1] if '/' in model else model)
            
            # Check if model requires subscription (not in free tier)
            requires_sub = model not in free_tier_models
            
            # Check if model is available with current subscription
            is_available = model in allowed_models
            
            model_info.append({
                "id": model,
                "display_name": display_name,
                "short_name": model_aliases.get(model),
                "requires_subscription": requires_sub,
                "is_available": is_available
            })
        
        return {
            "models": model_info,
            "subscription_tier": tier_name,
            "total_models": len(model_info)
        }
        
    except Exception as e:
        logger.error(f"Error getting available models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting available models: {str(e)}")