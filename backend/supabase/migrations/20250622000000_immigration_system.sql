-- H2A Immigration Attorney Database Schema
-- Migration to add immigration system tables

-- Immigration cases table
CREATE TABLE immigration_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    case_type VARCHAR(50) DEFAULT 'H2A' NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    priority_level VARCHAR(20) DEFAULT 'normal' NOT NULL, -- urgent, high, normal, low
    
    -- H2A specific fields
    petition_type VARCHAR(50), -- initial, extension, amendment
    number_of_workers INTEGER,
    labor_cert_number VARCHAR(100),
    labor_cert_expiry DATE,
    employment_start_date DATE,
    employment_end_date DATE,
    
    -- USCIS tracking
    uscis_receipt_number VARCHAR(50),
    uscis_status VARCHAR(100),
    filing_date DATE,
    decision_date DATE,
    
    -- Deadlines and important dates
    rfe_deadline DATE,
    response_deadline DATE,
    appeal_deadline DATE,
    
    -- Client information
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    employer_name VARCHAR(255),
    
    -- Case metadata
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflows table for storing attorney-defined workflows
CREATE TABLE immigration_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_type VARCHAR(50) DEFAULT 'email_processing',
    
    -- Workflow definition in markdown format
    workflow_content TEXT NOT NULL,
    
    -- Trigger conditions (JSON format)
    trigger_conditions JSONB DEFAULT '{}',
    
    -- Actions to take (JSON format)
    actions JSONB DEFAULT '{}',
    
    -- Workflow settings
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5, -- 1-10, higher = more priority
    
    -- Version control
    version INTEGER DEFAULT 1,
    parent_workflow_id UUID REFERENCES immigration_workflows(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Case documents and communications
CREATE TABLE immigration_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES immigration_cases(id) ON DELETE CASCADE,
    
    -- Document information
    document_type VARCHAR(100) NOT NULL, -- email, rfe, response, form, evidence
    document_subtype VARCHAR(100), -- i129, labor_cert, approval_notice, etc.
    title VARCHAR(500),
    content TEXT,
    
    -- Email specific fields
    email_from VARCHAR(255),
    email_to VARCHAR(255),
    email_subject VARCHAR(500),
    email_date TIMESTAMP,
    email_message_id VARCHAR(255),
    
    -- File attachments
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(100),
    
    -- Processing information
    processed_by_ai BOOLEAN DEFAULT false,
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processed, error
    processing_notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent memory for learning from attorney feedback
CREATE TABLE immigration_agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Memory classification
    memory_type VARCHAR(50) NOT NULL, -- instruction, preference, correction, example
    category VARCHAR(100), -- email_processing, document_drafting, client_communication
    
    -- Memory content
    context TEXT NOT NULL, -- What situation this applies to
    instruction TEXT NOT NULL, -- What the agent should do/not do
    example_input TEXT, -- Example input that triggered this memory
    example_output TEXT, -- Example of correct output
    
    -- Learning metadata
    source VARCHAR(50) DEFAULT 'slack_feedback', -- slack_feedback, manual_entry, system
    confidence_score FLOAT DEFAULT 1.0, -- 0.0 to 1.0
    importance_score INTEGER DEFAULT 5, -- 1-10
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP,
    
    -- Feedback information
    feedback_text TEXT, -- Original attorney feedback
    feedback_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email processing logs
CREATE TABLE immigration_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Email identification
    email_message_id VARCHAR(255) NOT NULL,
    email_subject VARCHAR(500),
    email_from VARCHAR(255),
    email_date TIMESTAMP,
    
    -- Processing results
    case_id UUID REFERENCES immigration_cases(id),
    workflow_id UUID REFERENCES immigration_workflows(id),
    processing_status VARCHAR(50) DEFAULT 'pending',
    
    -- AI analysis results
    classification_result JSONB, -- What type of email, priority, etc.
    case_association_result JSONB, -- How it was associated with a case
    action_taken JSONB, -- What actions were performed
    
    -- Workflow execution
    workflow_steps_executed JSONB, -- Which workflow steps ran
    workflow_execution_time INTEGER, -- Milliseconds
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Slack communications log
CREATE TABLE immigration_slack_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Message information
    message_type VARCHAR(50) NOT NULL, -- notification, question, draft, update
    message_content TEXT NOT NULL,
    priority_level VARCHAR(20) DEFAULT 'normal',
    
    -- Context
    case_id UUID REFERENCES immigration_cases(id),
    related_document_id UUID REFERENCES immigration_documents(id),
    
    -- Response tracking
    attorney_response TEXT,
    response_date TIMESTAMP,
    response_type VARCHAR(50), -- approval, correction, instruction, question
    
    -- Learning integration
    created_memory_id UUID REFERENCES immigration_agent_memory(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow execution history
CREATE TABLE immigration_workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    workflow_id UUID REFERENCES immigration_workflows(id),
    case_id UUID REFERENCES immigration_cases(id),
    email_log_id UUID REFERENCES immigration_email_logs(id),
    
    -- Execution details
    execution_status VARCHAR(50) DEFAULT 'running', -- running, completed, failed
    steps_completed INTEGER DEFAULT 0,
    total_steps INTEGER,
    
    -- Results
    execution_result JSONB,
    error_details TEXT,
    execution_time_ms INTEGER,
    
    -- Context
    input_data JSONB,
    output_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_immigration_cases_case_number ON immigration_cases(case_number);
CREATE INDEX idx_immigration_cases_status ON immigration_cases(status);
CREATE INDEX idx_immigration_cases_client_name ON immigration_cases(client_name);
CREATE INDEX idx_immigration_cases_priority ON immigration_cases(priority_level);
CREATE INDEX idx_immigration_cases_deadlines ON immigration_cases(rfe_deadline, response_deadline, appeal_deadline);

CREATE INDEX idx_immigration_documents_case_id ON immigration_documents(case_id);
CREATE INDEX idx_immigration_documents_type ON immigration_documents(document_type, document_subtype);
CREATE INDEX idx_immigration_documents_email_date ON immigration_documents(email_date);
CREATE INDEX idx_immigration_documents_processing ON immigration_documents(processing_status);

CREATE INDEX idx_immigration_workflows_active ON immigration_workflows(is_active);
CREATE INDEX idx_immigration_workflows_type ON immigration_workflows(workflow_type);
CREATE INDEX idx_immigration_workflows_priority ON immigration_workflows(priority);

CREATE INDEX idx_immigration_agent_memory_type ON immigration_agent_memory(memory_type, category);
CREATE INDEX idx_immigration_agent_memory_importance ON immigration_agent_memory(importance_score);
CREATE INDEX idx_immigration_agent_memory_usage ON immigration_agent_memory(usage_count, last_used);

CREATE INDEX idx_immigration_email_logs_message_id ON immigration_email_logs(email_message_id);
CREATE INDEX idx_immigration_email_logs_status ON immigration_email_logs(processing_status);
CREATE INDEX idx_immigration_email_logs_case_id ON immigration_email_logs(case_id);

-- Sample data for testing
INSERT INTO immigration_workflows (name, description, workflow_content, trigger_conditions, actions, priority) VALUES 
(
    'H2A RFE Processing',
    'Workflow for handling H2A Request for Evidence emails',
    '# H2A RFE Processing Workflow

## Trigger Conditions
- Email contains "RFE" or "Request for Evidence"
- Email from USCIS domain
- Subject contains case number

## Actions
1. **Immediate Response** (within 1 hour)
   - Send acknowledgment to client
   - Calculate 87-day response deadline
   - Create calendar reminders

2. **Analysis** (within 24 hours)
   - Extract specific evidence requested
   - Identify missing documents
   - Assess complexity level

3. **Client Communication**
   - Draft detailed response timeline
   - Request specific documents with deadlines
   - Schedule strategy meeting if complex

4. **Attorney Notification**
   - Slack notification with RFE summary
   - Attach RFE document
   - Highlight critical deadlines',
    '{"email_contains": ["RFE", "Request for Evidence"], "from_domain": "uscis.gov", "case_type": "H2A"}',
    '{"immediate": ["acknowledge_receipt", "calculate_deadline"], "within_24h": ["analyze_requirements", "notify_attorney"], "within_48h": ["contact_client", "create_timeline"]}',
    9
),
(
    'H2A Approval Processing',
    'Workflow for handling H2A approval notices',
    '# H2A Approval Processing Workflow

## Trigger Conditions
- Email contains "Approval Notice" or "I-797"
- Email from USCIS
- Case status update

## Actions
1. **Update Case Status**
   - Mark case as approved
   - Record approval date
   - Update client records

2. **Client Notification**
   - Send congratulations email
   - Provide next steps for workers
   - Schedule visa application consultation

3. **Internal Processing**
   - Update billing records
   - Archive case documents
   - Prepare worker instruction packets',
    '{"email_contains": ["Approval Notice", "I-797", "approved"], "from_domain": "uscis.gov"}',
    '{"immediate": ["update_status", "notify_client"], "within_24h": ["update_billing", "prepare_instructions"]}',
    8
);

-- Sample cases for testing
INSERT INTO immigration_cases (case_number, client_name, case_type, status, number_of_workers, employment_start_date, employment_end_date, client_email, employer_name) VALUES 
(
    'MSC2025001234',
    'Green Valley Farms LLC',
    'H2A',
    'pending',
    25,
    '2025-04-01',
    '2025-10-31',
    'hr@greenvalleyfarms.com',
    'Green Valley Farms LLC'
),
(
    'EAC2025005678',
    'Sunshine Agriculture Inc',
    'H2A',
    'rfe_received',
    15,
    '2025-05-15',
    '2025-09-30',
    'legal@sunshineag.com',
    'Sunshine Agriculture Inc'
);