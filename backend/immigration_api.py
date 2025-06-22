"""
Immigration Attorney API Routes
Extends Suna backend with H2A visa processing capabilities
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import uuid
from services.supabase import get_supabase_client
from utils.logger import logger
import asyncio

# Initialize router
immigration_router = APIRouter(prefix="/api/immigration", tags=["immigration"])

# Pydantic models for request/response
class MockEmail(BaseModel):
    from_email: str = Field(..., description="Sender email address")
    to_email: str = Field(..., description="Recipient email address") 
    subject: str = Field(..., description="Email subject")
    content: str = Field(..., description="Email content/body")
    attachments: Optional[List[str]] = Field(default=[], description="List of attachment filenames")
    received_date: Optional[datetime] = Field(default_factory=datetime.now)

class SlackMessage(BaseModel):
    message: str = Field(..., description="Slack message content")
    priority: str = Field(default="normal", description="Message priority: urgent, high, normal, low")
    case_id: Optional[str] = Field(None, description="Related case ID")
    message_type: str = Field(default="notification", description="Type: notification, question, draft, update")

class WorkflowUpdate(BaseModel):
    workflow_id: str = Field(..., description="Workflow ID to update")
    content: str = Field(..., description="Updated workflow content in markdown")
    description: Optional[str] = Field(None, description="Update description")

class CaseCreate(BaseModel):
    case_number: str = Field(..., description="Unique case number")
    client_name: str = Field(..., description="Client/employer name")
    case_type: str = Field(default="H2A", description="Case type")
    number_of_workers: Optional[int] = Field(None, description="Number of H2A workers")
    employment_start_date: Optional[datetime] = Field(None)
    employment_end_date: Optional[datetime] = Field(None)
    client_email: Optional[str] = Field(None)
    employer_name: Optional[str] = Field(None)

class AgentFeedback(BaseModel):
    feedback_text: str = Field(..., description="Attorney feedback text")
    context: Optional[str] = Field(None, description="Context where feedback applies")
    case_id: Optional[str] = Field(None, description="Related case ID")
    feedback_type: str = Field(default="correction", description="Type: correction, preference, instruction")

# Email processing endpoint
@immigration_router.post("/process-email")
async def process_mock_email(email: MockEmail, background_tasks: BackgroundTasks):
    """Process a mock email through H2A workflows"""
    try:
        supabase = await get_supabase_client()
        
        # Generate unique message ID
        message_id = f"mock_{uuid.uuid4().hex[:12]}"
        
        # Log email receipt
        email_log = {
            "email_message_id": message_id,
            "email_subject": email.subject,
            "email_from": email.from_email,
            "email_date": email.received_date.isoformat(),
            "processing_status": "processing"
        }
        
        result = await supabase.table('immigration_email_logs').insert(email_log).execute()
        log_id = result.data[0]['id']
        
        # Process email in background
        background_tasks.add_task(process_email_workflow, email, log_id)
        
        return {
            "success": True,
            "message": "Email received and processing started",
            "email_log_id": log_id,
            "message_id": message_id
        }
        
    except Exception as e:
        logger.error(f"Error processing email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing email: {str(e)}")

async def process_email_workflow(email: MockEmail, log_id: str):
    """Background task to process email through workflows"""
    try:
        supabase = await get_supabase_client()
        
        # Analyze email content
        analysis = await analyze_email_content(email)
        
        # Find matching case
        case_id = await associate_email_with_case(email, analysis)
        
        # Execute appropriate workflow
        workflow_result = await execute_email_workflow(email, analysis, case_id)
        
        # Update log with results
        await supabase.table('immigration_email_logs').update({
            "processing_status": "completed",
            "case_id": case_id,
            "classification_result": analysis,
            "action_taken": workflow_result,
            "workflow_execution_time": workflow_result.get("execution_time_ms", 0)
        }).eq('id', log_id).execute()
        
        # Send Slack notification if needed
        if workflow_result.get("notify_attorney"):
            await send_slack_notification(workflow_result["slack_message"], case_id)
            
    except Exception as e:
        logger.error(f"Error in email workflow: {str(e)}")
        # Update log with error
        supabase = await get_supabase_client()
        await supabase.table('immigration_email_logs').update({
            "processing_status": "error",
            "error_message": str(e)
        }).eq('id', log_id).execute()

async def analyze_email_content(email: MockEmail) -> Dict[str, Any]:
    """Analyze email content to determine type, priority, and actions"""
    content_lower = email.content.lower()
    subject_lower = email.subject.lower()
    
    analysis = {
        "email_type": "general",
        "priority": "normal",
        "contains_case_number": False,
        "case_number": None,
        "uscis_communication": False,
        "requires_response": False,
        "deadline_mentioned": False,
        "keywords": []
    }
    
    # Check for USCIS communication
    if "uscis.gov" in email.from_email.lower() or "uscis" in subject_lower:
        analysis["uscis_communication"] = True
        analysis["priority"] = "high"
    
    # Check for RFE
    if any(term in content_lower or term in subject_lower for term in ["rfe", "request for evidence"]):
        analysis["email_type"] = "rfe"
        analysis["priority"] = "urgent"
        analysis["requires_response"] = True
        analysis["keywords"].append("RFE")
    
    # Check for approval
    if any(term in content_lower or term in subject_lower for term in ["approval", "approved", "i-797"]):
        analysis["email_type"] = "approval"
        analysis["priority"] = "high"
        analysis["keywords"].append("Approval")
    
    # Check for denial
    if any(term in content_lower or term in subject_lower for term in ["denial", "denied", "notice of intent to deny"]):
        analysis["email_type"] = "denial"
        analysis["priority"] = "urgent"
        analysis["keywords"].append("Denial")
    
    # Extract case number (pattern: 3 letters + 10 digits)
    import re
    case_pattern = r'\b[A-Z]{3}\d{10}\b'
    case_match = re.search(case_pattern, email.subject + " " + email.content)
    if case_match:
        analysis["contains_case_number"] = True
        analysis["case_number"] = case_match.group()
    
    # Check for deadlines
    deadline_keywords = ["deadline", "due date", "respond by", "within", "days"]
    if any(keyword in content_lower for keyword in deadline_keywords):
        analysis["deadline_mentioned"] = True
    
    return analysis

async def associate_email_with_case(email: MockEmail, analysis: Dict[str, Any]) -> Optional[str]:
    """Associate email with existing case or create new one"""
    try:
        supabase = await get_supabase_client()
        
        # First try to match by case number
        if analysis["contains_case_number"]:
            result = await supabase.table('immigration_cases').select('id').eq('case_number', analysis["case_number"]).execute()
            if result.data:
                return result.data[0]['id']
        
        # Try to match by client email domain
        if email.from_email:
            domain = email.from_email.split('@')[-1]
            result = await supabase.table('immigration_cases').select('id').ilike('client_email', f'%{domain}%').execute()
            if result.data:
                return result.data[0]['id']
        
        # If no match and it's from USCIS, try to find by subject keywords
        if analysis["uscis_communication"]:
            # Look for client names in subject
            result = await supabase.table('immigration_cases').select('id, client_name').execute()
            for case in result.data:
                if case['client_name'].lower() in email.subject.lower():
                    return case['id']
        
        return None
        
    except Exception as e:
        logger.error(f"Error associating email with case: {str(e)}")
        return None

async def execute_email_workflow(email: MockEmail, analysis: Dict[str, Any], case_id: Optional[str]) -> Dict[str, Any]:
    """Execute appropriate workflow based on email analysis"""
    start_time = datetime.now()
    
    workflow_result = {
        "workflow_executed": None,
        "actions_taken": [],
        "notify_attorney": False,
        "slack_message": None,
        "documents_created": [],
        "case_updates": {}
    }
    
    try:
        supabase = await get_supabase_client()
        
        # Get appropriate workflow
        workflow_type = analysis["email_type"]
        result = await supabase.table('immigration_workflows').select('*').eq('workflow_type', 'email_processing').eq('is_active', True).order('priority', desc=True).execute()
        
        if not result.data:
            # Default workflow
            workflow_result["workflow_executed"] = "default"
            workflow_result["actions_taken"].append("logged_email")
        else:
            # Execute specific workflow
            workflow = result.data[0]
            workflow_result["workflow_executed"] = workflow["name"]
            
            # Execute workflow actions based on email type
            if analysis["email_type"] == "rfe":
                await execute_rfe_workflow(email, analysis, case_id, workflow_result)
            elif analysis["email_type"] == "approval":
                await execute_approval_workflow(email, analysis, case_id, workflow_result)
            elif analysis["email_type"] == "denial":
                await execute_denial_workflow(email, analysis, case_id, workflow_result)
            else:
                await execute_general_workflow(email, analysis, case_id, workflow_result)
        
        # Store email document
        await store_email_document(email, analysis, case_id)
        workflow_result["actions_taken"].append("stored_email_document")
        
        # Calculate execution time
        end_time = datetime.now()
        workflow_result["execution_time_ms"] = int((end_time - start_time).total_seconds() * 1000)
        
        return workflow_result
        
    except Exception as e:
        logger.error(f"Error executing workflow: {str(e)}")
        workflow_result["error"] = str(e)
        return workflow_result

async def execute_rfe_workflow(email: MockEmail, analysis: Dict[str, Any], case_id: Optional[str], result: Dict[str, Any]):
    """Execute RFE-specific workflow"""
    try:
        supabase = await get_supabase_client()
        
        # Calculate deadline (87 days from email date)
        deadline = email.received_date + timedelta(days=87)
        
        # Update case with RFE deadline
        if case_id:
            await supabase.table('immigration_cases').update({
                "status": "rfe_received",
                "rfe_deadline": deadline.isoformat(),
                "priority_level": "urgent"
            }).eq('id', case_id).execute()
            result["case_updates"]["status"] = "rfe_received"
            result["case_updates"]["rfe_deadline"] = deadline.isoformat()
        
        # Prepare Slack notification
        case_info = ""
        if case_id:
            case_result = await supabase.table('immigration_cases').select('case_number, client_name').eq('id', case_id).execute()
            if case_result.data:
                case_data = case_result.data[0]
                case_info = f"Case: {case_data['case_number']} ({case_data['client_name']})"
        
        result["notify_attorney"] = True
        result["slack_message"] = {
            "message": f"🚨 RFE RECEIVED\n\n{case_info}\nDeadline: {deadline.strftime('%B %d, %Y')}\nSubject: {email.subject}",
            "priority": "urgent",
            "case_id": case_id,
            "message_type": "notification"
        }
        
        result["actions_taken"].extend([
            "calculated_rfe_deadline",
            "updated_case_status",
            "prepared_attorney_notification"
        ])
        
    except Exception as e:
        logger.error(f"Error in RFE workflow: {str(e)}")
        result["error"] = str(e)

async def execute_approval_workflow(email: MockEmail, analysis: Dict[str, Any], case_id: Optional[str], result: Dict[str, Any]):
    """Execute approval-specific workflow"""
    try:
        supabase = await get_supabase_client()
        
        # Update case status
        if case_id:
            await supabase.table('immigration_cases').update({
                "status": "approved",
                "decision_date": email.received_date.isoformat(),
                "priority_level": "normal"
            }).eq('id', case_id).execute()
            result["case_updates"]["status"] = "approved"
        
        # Prepare Slack notification
        case_info = ""
        if case_id:
            case_result = await supabase.table('immigration_cases').select('case_number, client_name').eq('id', case_id).execute()
            if case_result.data:
                case_data = case_result.data[0]
                case_info = f"Case: {case_data['case_number']} ({case_data['client_name']})"
        
        result["notify_attorney"] = True
        result["slack_message"] = {
            "message": f"✅ APPROVAL RECEIVED\n\n{case_info}\nSubject: {email.subject}",
            "priority": "high",
            "case_id": case_id,
            "message_type": "notification"
        }
        
        result["actions_taken"].extend([
            "updated_case_to_approved",
            "prepared_attorney_notification"
        ])
        
    except Exception as e:
        logger.error(f"Error in approval workflow: {str(e)}")
        result["error"] = str(e)

async def execute_denial_workflow(email: MockEmail, analysis: Dict[str, Any], case_id: Optional[str], result: Dict[str, Any]):
    """Execute denial-specific workflow"""
    try:
        supabase = await get_supabase_client()
        
        # Calculate appeal deadline (typically 30 days)
        appeal_deadline = email.received_date + timedelta(days=30)
        
        # Update case status
        if case_id:
            await supabase.table('immigration_cases').update({
                "status": "denied",
                "decision_date": email.received_date.isoformat(),
                "appeal_deadline": appeal_deadline.isoformat(),
                "priority_level": "urgent"
            }).eq('id', case_id).execute()
            result["case_updates"]["status"] = "denied"
            result["case_updates"]["appeal_deadline"] = appeal_deadline.isoformat()
        
        # Prepare Slack notification
        case_info = ""
        if case_id:
            case_result = await supabase.table('immigration_cases').select('case_number, client_name').eq('id', case_id).execute()
            if case_result.data:
                case_data = case_result.data[0]
                case_info = f"Case: {case_data['case_number']} ({case_data['client_name']})"
        
        result["notify_attorney"] = True
        result["slack_message"] = {
            "message": f"❌ DENIAL RECEIVED\n\n{case_info}\nAppeal Deadline: {appeal_deadline.strftime('%B %d, %Y')}\nSubject: {email.subject}",
            "priority": "urgent",
            "case_id": case_id,
            "message_type": "notification"
        }
        
        result["actions_taken"].extend([
            "updated_case_to_denied",
            "calculated_appeal_deadline",
            "prepared_attorney_notification"
        ])
        
    except Exception as e:
        logger.error(f"Error in denial workflow: {str(e)}")
        result["error"] = str(e)

async def execute_general_workflow(email: MockEmail, analysis: Dict[str, Any], case_id: Optional[str], result: Dict[str, Any]):
    """Execute general email workflow"""
    try:
        # For general emails, just log and notify if high priority
        if analysis["priority"] in ["high", "urgent"] or analysis["uscis_communication"]:
            case_info = ""
            if case_id:
                supabase = await get_supabase_client()
                case_result = await supabase.table('immigration_cases').select('case_number, client_name').eq('id', case_id).execute()
                if case_result.data:
                    case_data = case_result.data[0]
                    case_info = f"Case: {case_data['case_number']} ({case_data['client_name']})"
            
            result["notify_attorney"] = True
            result["slack_message"] = {
                "message": f"📧 New Email\n\n{case_info}\nFrom: {email.from_email}\nSubject: {email.subject}",
                "priority": analysis["priority"],
                "case_id": case_id,
                "message_type": "notification"
            }
        
        result["actions_taken"].append("processed_general_email")
        
    except Exception as e:
        logger.error(f"Error in general workflow: {str(e)}")
        result["error"] = str(e)

async def store_email_document(email: MockEmail, analysis: Dict[str, Any], case_id: Optional[str]):
    """Store email as document in database"""
    try:
        supabase = await get_supabase_client()
        
        document = {
            "case_id": case_id,
            "document_type": "email",
            "document_subtype": analysis["email_type"],
            "title": email.subject,
            "content": email.content,
            "email_from": email.from_email,
            "email_to": email.to_email,
            "email_subject": email.subject,
            "email_date": email.received_date.isoformat(),
            "email_message_id": f"mock_{uuid.uuid4().hex[:12]}",
            "processed_by_ai": True,
            "processing_status": "processed",
            "metadata": {
                "analysis": analysis,
                "attachments": email.attachments
            }
        }
        
        await supabase.table('immigration_documents').insert(document).execute()
        
    except Exception as e:
        logger.error(f"Error storing email document: {str(e)}")

# Slack simulation endpoints
@immigration_router.post("/slack/send")
async def send_slack_message(message: SlackMessage):
    """Send a mock Slack message (simulation)"""
    try:
        supabase = await get_supabase_client()
        
        # Store Slack message in log
        slack_log = {
            "message_type": message.message_type,
            "message_content": message.message,
            "priority_level": message.priority,
            "case_id": message.case_id
        }
        
        result = await supabase.table('immigration_slack_logs').insert(slack_log).execute()
        
        return {
            "success": True,
            "message": "Slack message sent",
            "slack_log_id": result.data[0]['id']
        }
        
    except Exception as e:
        logger.error(f"Error sending Slack message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending Slack message: {str(e)}")

async def send_slack_notification(slack_data: Dict[str, Any], case_id: Optional[str]):
    """Internal function to send Slack notifications"""
    try:
        supabase = await get_supabase_client()
        
        slack_log = {
            "message_type": slack_data["message_type"],
            "message_content": slack_data["message"],
            "priority_level": slack_data["priority"],
            "case_id": case_id
        }
        
        await supabase.table('immigration_slack_logs').insert(slack_log).execute()
        
    except Exception as e:
        logger.error(f"Error sending Slack notification: {str(e)}")

@immigration_router.post("/slack/respond")
async def respond_to_slack(slack_id: str, response: AgentFeedback):
    """Attorney responds to Slack message with feedback"""
    try:
        supabase = await get_supabase_client()
        
        # Update Slack log with response
        await supabase.table('immigration_slack_logs').update({
            "attorney_response": response.feedback_text,
            "response_date": datetime.now().isoformat(),
            "response_type": response.feedback_type
        }).eq('id', slack_id).execute()
        
        # Process feedback for learning
        memory_id = await process_attorney_feedback(response)
        
        # Link memory to Slack log
        if memory_id:
            await supabase.table('immigration_slack_logs').update({
                "created_memory_id": memory_id
            }).eq('id', slack_id).execute()
        
        return {
            "success": True,
            "message": "Feedback processed and learned",
            "memory_id": memory_id
        }
        
    except Exception as e:
        logger.error(f"Error processing Slack response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing Slack response: {str(e)}")

async def process_attorney_feedback(feedback: AgentFeedback) -> Optional[str]:
    """Process attorney feedback and create agent memory"""
    try:
        supabase = await get_supabase_client()
        
        # Analyze feedback to extract learning
        memory_entry = {
            "memory_type": feedback.feedback_type,
            "category": "email_processing",  # Default category
            "context": feedback.context or "General feedback",
            "instruction": feedback.feedback_text,
            "source": "slack_feedback",
            "confidence_score": 1.0,
            "importance_score": 7,  # Default importance
            "feedback_text": feedback.feedback_text,
            "feedback_date": datetime.now().isoformat()
        }
        
        # Determine category and importance based on feedback content
        feedback_lower = feedback.feedback_text.lower()
        if any(word in feedback_lower for word in ["email", "message", "communication"]):
            memory_entry["category"] = "email_processing"
        elif any(word in feedback_lower for word in ["document", "draft", "letter"]):
            memory_entry["category"] = "document_drafting"
        elif any(word in feedback_lower for word in ["client", "communication", "notification"]):
            memory_entry["category"] = "client_communication"
        
        # Increase importance for strong feedback
        if any(word in feedback_lower for word in ["never", "always", "critical", "important"]):
            memory_entry["importance_score"] = 9
        elif any(word in feedback_lower for word in ["don't", "stop", "avoid"]):
            memory_entry["importance_score"] = 8
        
        result = await supabase.table('immigration_agent_memory').insert(memory_entry).execute()
        return result.data[0]['id']
        
    except Exception as e:
        logger.error(f"Error processing attorney feedback: {str(e)}")
        return None

# Case management endpoints
@immigration_router.get("/cases")
async def get_cases(status: Optional[str] = None, limit: int = 50):
    """Get immigration cases"""
    try:
        supabase = await get_supabase_client()
        
        query = supabase.table('immigration_cases').select('*').order('created_at', desc=True).limit(limit)
        
        if status:
            query = query.eq('status', status)
        
        result = await query.execute()
        
        return {
            "success": True,
            "cases": result.data,
            "count": len(result.data)
        }
        
    except Exception as e:
        logger.error(f"Error getting cases: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting cases: {str(e)}")

@immigration_router.post("/cases")
async def create_case(case: CaseCreate):
    """Create new immigration case"""
    try:
        supabase = await get_supabase_client()
        
        case_data = case.dict()
        case_data['id'] = str(uuid.uuid4())
        
        # Convert datetime fields to ISO strings
        if case_data.get('employment_start_date'):
            case_data['employment_start_date'] = case_data['employment_start_date'].isoformat()
        if case_data.get('employment_end_date'):
            case_data['employment_end_date'] = case_data['employment_end_date'].isoformat()
        
        result = await supabase.table('immigration_cases').insert(case_data).execute()
        
        return {
            "success": True,
            "message": "Case created successfully",
            "case": result.data[0]
        }
        
    except Exception as e:
        logger.error(f"Error creating case: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating case: {str(e)}")

# Workflow management endpoints
@immigration_router.get("/workflows")
async def get_workflows():
    """Get all workflows"""
    try:
        supabase = await get_supabase_client()
        
        result = await supabase.table('immigration_workflows').select('*').order('priority', desc=True).execute()
        
        return {
            "success": True,
            "workflows": result.data
        }
        
    except Exception as e:
        logger.error(f"Error getting workflows: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting workflows: {str(e)}")

@immigration_router.put("/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, update: WorkflowUpdate):
    """Update workflow content"""
    try:
        supabase = await get_supabase_client()
        
        # Create new version of workflow
        current_result = await supabase.table('immigration_workflows').select('*').eq('id', workflow_id).execute()
        if not current_result.data:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        current_workflow = current_result.data[0]
        
        # Update workflow
        update_data = {
            "workflow_content": update.content,
            "version": current_workflow["version"] + 1,
            "updated_at": datetime.now().isoformat()
        }
        
        if update.description:
            update_data["description"] = update.description
        
        result = await supabase.table('immigration_workflows').update(update_data).eq('id', workflow_id).execute()
        
        return {
            "success": True,
            "message": "Workflow updated successfully",
            "workflow": result.data[0]
        }
        
    except Exception as e:
        logger.error(f"Error updating workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating workflow: {str(e)}")

# Dashboard data endpoints
@immigration_router.get("/dashboard")
async def get_dashboard_data():
    """Get dashboard data for immigration attorney"""
    try:
        supabase = await get_supabase_client()
        
        # Get case statistics
        cases_result = await supabase.table('immigration_cases').select('status').execute()
        case_stats = {}
        for case in cases_result.data:
            status = case['status']
            case_stats[status] = case_stats.get(status, 0) + 1
        
        # Get recent email activity
        recent_emails = await supabase.table('immigration_email_logs').select('*').order('created_at', desc=True).limit(10).execute()
        
        # Get recent Slack messages
        recent_slack = await supabase.table('immigration_slack_logs').select('*').order('created_at', desc=True).limit(10).execute()
        
        # Get urgent cases (with deadlines)
        urgent_cases = await supabase.table('immigration_cases').select('*').not_.is_('rfe_deadline', 'null').order('rfe_deadline').limit(5).execute()
        
        return {
            "success": True,
            "dashboard": {
                "case_statistics": case_stats,
                "recent_email_activity": recent_emails.data,
                "recent_slack_messages": recent_slack.data,
                "urgent_cases": urgent_cases.data,
                "total_cases": len(cases_result.data)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting dashboard data: {str(e)}")

# Agent memory endpoints
@immigration_router.get("/memory")
async def get_agent_memory(category: Optional[str] = None, limit: int = 50):
    """Get agent memory entries"""
    try:
        supabase = await get_supabase_client()
        
        query = supabase.table('immigration_agent_memory').select('*').order('importance_score', desc=True).limit(limit)
        
        if category:
            query = query.eq('category', category)
        
        result = await query.execute()
        
        return {
            "success": True,
            "memory_entries": result.data
        }
        
    except Exception as e:
        logger.error(f"Error getting agent memory: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting agent memory: {str(e)}")