from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    project_id: str
    account_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Aggiungi altri campi necessari qui

class ProjectListItem(BaseModel):
    project_id: str
    account_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Aggiungi altri campi necessari qui

class ThreadListItem(BaseModel):
    thread_id: str
    project_id: str
    account_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Aggiungi altri campi necessari qui

class ThreadResponse(BaseModel):
    thread_id: str
    project_id: str
    account_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Aggiungi altri campi necessari qui

# Potrebbe essere necessario definire altri modelli usati internamente o in altre parti dell'API. 