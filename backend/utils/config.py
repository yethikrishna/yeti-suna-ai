"""
Configuration management.

This module provides a centralized way to access configuration settings and
environment variables across the application. It supports different environment
modes (development, staging, production) and provides validation for required
values.

Usage:
    from utils.config import config
    
    # Access configuration values
    api_key = config.OPENAI_API_KEY
    env_mode = config.ENV_MODE
"""

import os
from enum import Enum
from typing import Dict, Any, Optional, get_type_hints, Union, List
from dotenv import load_dotenv
import logging

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic.fields import computed_field

logger = logging.getLogger(__name__)

class EnvMode(Enum):
    """Environment mode enumeration."""
    LOCAL = "local"
    STAGING = "staging"
    PRODUCTION = "production"

class Settings(BaseSettings):
    """
    Centralized configuration for AgentPress backend using Pydantic-Settings.
    Settings are loaded from .env files and environment variables.
    """
    # Environment mode - loaded first to determine other defaults/logic
    ENV_MODE: EnvMode = Field(default=EnvMode.LOCAL)

    # Subscription tier IDs - Production (defaults)
    STRIPE_FREE_TIER_ID_PROD: str = 'price_1RILb4G6l1KZGqIrK4QLrx9i'
    STRIPE_TIER_2_20_ID_PROD: str = 'price_1RILb4G6l1KZGqIrhomjgDnO'
    STRIPE_TIER_6_50_ID_PROD: str = 'price_1RILb4G6l1KZGqIr5q0sybWn'
    STRIPE_TIER_12_100_ID_PROD: str = 'price_1RILb4G6l1KZGqIr5Y20ZLHm'
    STRIPE_TIER_25_200_ID_PROD: str = 'price_1RILb4G6l1KZGqIrGAD8rNjb'
    STRIPE_TIER_50_400_ID_PROD: str = 'price_1RILb4G6l1KZGqIruNBUMTF1'
    STRIPE_TIER_125_800_ID_PROD: str = 'price_1RILb3G6l1KZGqIrbJA766tN'
    STRIPE_TIER_200_1000_ID_PROD: str = 'price_1RILb3G6l1KZGqIrmauYPOiN'

    # Subscription tier IDs - Staging (loaded from env if present, otherwise not used directly by computed fields if ENV_MODE isn't staging)
    STRIPE_FREE_TIER_ID_STAGING: Optional[str] = 'price_1RIGvuG6l1KZGqIrw14abxeL'
    STRIPE_TIER_2_20_ID_STAGING: Optional[str] = 'price_1RIGvuG6l1KZGqIrCRu0E4Gi'
    STRIPE_TIER_6_50_ID_STAGING: Optional[str] = 'price_1RIGvuG6l1KZGqIrvjlz5p5V'
    STRIPE_TIER_12_100_ID_STAGING: Optional[str] = 'price_1RIGvuG6l1KZGqIrT6UfgblC'
    STRIPE_TIER_25_200_ID_STAGING: Optional[str] = 'price_1RIGvuG6l1KZGqIrOVLKlOMj'
    STRIPE_TIER_50_400_ID_STAGING: Optional[str] = 'price_1RIKNgG6l1KZGqIrvsat5PW7'
    STRIPE_TIER_125_800_ID_STAGING: Optional[str] = 'price_1RIKNrG6l1KZGqIrjKT0yGvI'
    STRIPE_TIER_200_1000_ID_STAGING: Optional[str] = 'price_1RIKQ2G6l1KZGqIrum9n8SI7'

    # Stripe Product IDs
    STRIPE_PRODUCT_ID_PROD: str = 'prod_SCl7AQ2C8kK1CD'
    STRIPE_PRODUCT_ID_STAGING: Optional[str] = 'prod_SCgIj3G7yPOAWY'

    # LLM API keys (Optional, as they might not all be set)
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    GEMINI_API_KEY: str
    OPENROUTER_API_BASE: str = "https://openrouter.ai/api/v1"
    OR_SITE_URL: str = "https://kortix.ai" # Default if not in env
    OR_APP_NAME: str = "Kortix AI"    # Default if not in env
    
    # AWS Bedrock credentials
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION_NAME: Optional[str] = None
    
    # Model configuration
    MODEL_TO_USE: str = "gemini/gemini-2.5-pro-preview-05-06"
    EMBEDDING_MODEL_TO_USE: str = "intfloat/multilingual-e5-large"
    
    # Supabase configuration (Required - no defaults means they must be in env)
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # Redis configuration
    REDIS_HOST: str
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None # Allow empty password for local dev
    REDIS_SSL: bool = True
    
    # Daytona sandbox configuration
    DAYTONA_API_KEY: Optional[str] = None
    DAYTONA_SERVER_URL: str
    DAYTONA_TARGET: Optional[str] = None
    
    # Search and other API keys
    TAVILY_API_KEY: str
    RAPID_API_KEY: str
    CLOUDFLARE_API_TOKEN: Optional[str] = None
    FIRECRAWL_API_KEY: str
    FIRECRAWL_URL: str = "https://api.firecrawl.dev"
    PERPLEXITY_API_KEY: Optional[str] = None
    
    # Stripe configuration
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_DEFAULT_PLAN_ID: Optional[str] = None
    STRIPE_DEFAULT_TRIAL_DAYS: int = 14

    # Computed Fields for Stripe IDs
    @computed_field
    @property
    def STRIPE_FREE_TIER_ID(self) -> str:
        return self.STRIPE_FREE_TIER_ID_STAGING if self.ENV_MODE == EnvMode.STAGING and self.STRIPE_FREE_TIER_ID_STAGING else self.STRIPE_FREE_TIER_ID_PROD
    
    @computed_field
    @property
    def STRIPE_TIER_2_20_ID(self) -> str:
        return self.STRIPE_TIER_2_20_ID_STAGING if self.ENV_MODE == EnvMode.STAGING and self.STRIPE_TIER_2_20_ID_STAGING else self.STRIPE_TIER_2_20_ID_PROD
    
    @computed_field
    @property
    def STRIPE_TIER_6_50_ID(self) -> str:
        return self.STRIPE_TIER_6_50_ID_STAGING if self.ENV_MODE == EnvMode.STAGING and self.STRIPE_TIER_6_50_ID_STAGING else self.STRIPE_TIER_6_50_ID_PROD
    
    @computed_field
    @property
    def STRIPE_TIER_12_100_ID(self) -> str:
        return self.STRIPE_TIER_12_100_ID_STAGING if self.ENV_MODE == EnvMode.STAGING and self.STRIPE_TIER_12_100_ID_STAGING else self.STRIPE_TIER_12_100_ID_PROD
    
    @computed_field
    @property
    def STRIPE_TIER_25_200_ID(self) -> str:
        return self.STRIPE_TIER_25_200_ID_STAGING if self.ENV_MODE == EnvMode.STAGING and self.STRIPE_TIER_25_200_ID_STAGING else self.STRIPE_TIER_25_200_ID_PROD
    
    @computed_field
    @property
    def STRIPE_TIER_50_400_ID(self) -> str:
        return self.STRIPE_TIER_50_400_ID_STAGING if self.ENV_MODE == EnvMode.STAGING and self.STRIPE_TIER_50_400_ID_STAGING else self.STRIPE_TIER_50_400_ID_PROD
    
    @computed_field
    @property
    def STRIPE_TIER_125_800_ID(self) -> str:
        return self.STRIPE_TIER_125_800_ID_STAGING if self.ENV_MODE == EnvMode.STAGING and self.STRIPE_TIER_125_800_ID_STAGING else self.STRIPE_TIER_125_800_ID_PROD
    
    @computed_field
    @property
    def STRIPE_TIER_200_1000_ID(self) -> str:
        return self.STRIPE_TIER_200_1000_ID_STAGING if self.ENV_MODE == EnvMode.STAGING and self.STRIPE_TIER_200_1000_ID_STAGING else self.STRIPE_TIER_200_1000_ID_PROD
    
    @computed_field
    @property
    def STRIPE_PRODUCT_ID(self) -> str:
        return self.STRIPE_PRODUCT_ID_STAGING if self.ENV_MODE == EnvMode.STAGING and self.STRIPE_PRODUCT_ID_STAGING else self.STRIPE_PRODUCT_ID_PROD
    
    model_config = SettingsConfigDict(
        env_file=".env",          # Load from .env file
        env_file_encoding='utf-8',
        extra='ignore',         # Ignore extra fields from environment
        case_sensitive=False,     # Environment variables are typically case-insensitive
    )

# Create a singleton instance, it will automatically load from .env and environment variables
# The load_dotenv() call from the old Configuration class is handled by BaseSettings.
config = Settings()

# Log the loaded environment mode after config initialization
logger.info(f"Configuration loaded. Environment mode: {config.ENV_MODE.value}")

# You can add a simple validation log or check here if needed, for example:
# if not config.SUPABASE_URL:
#     logger.critical("SUPABASE_URL is not set in the environment!")

# The old _validate() method is mostly handled by Pydantic if fields are not Optional
# and don't have defaults. Pydantic raises a ValidationError if required fields are missing.

# The old as_dict() can be replaced with config.model_dump() (Pydantic V2)
# or config.dict() (Pydantic V1).

# The old get(key, default) is less necessary as attributes can be accessed directly,
# and Optionals handle missing values gracefully.

# Create a singleton instance
# config = Configuration() 