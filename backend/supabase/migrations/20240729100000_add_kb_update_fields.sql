-- Migration: Add fields for automated KB updates
-- File: backend/supabase/migrations/20240729100000_add_kb_update_fields.sql

-- Add last_checked_at column to track when automation last checked the source
ALTER TABLE public.knowledge_base_documents
ADD COLUMN last_checked_at TIMESTAMP WITH TIME ZONE;

-- Add content_hash column to store hash of extracted text for change detection
ALTER TABLE public.knowledge_base_documents
ADD COLUMN content_hash TEXT;

-- Add index for querying documents to check
CREATE INDEX idx_kb_documents_last_checked ON public.knowledge_base_documents (last_checked_at ASC NULLS FIRST);
-- Index on mime_type and status might already exist or be helpful
-- CREATE INDEX IF NOT EXISTS idx_kb_documents_mime_type ON public.knowledge_base_documents(mime_type);
-- CREATE INDEX IF NOT EXISTS idx_kb_documents_status ON public.knowledge_base_documents(status);

-- Optional: Backfill last_checked_at for existing documents to avoid immediate check
-- UPDATE public.knowledge_base_documents
-- SET last_checked_at = created_at -- Or set to now() if you want them checked soon
-- WHERE last_checked_at IS NULL;

-- Optional: Add update_frequency column if needed later
-- ALTER TABLE public.knowledge_base_documents
-- ADD COLUMN update_frequency TEXT DEFAULT 'daily'; -- Example values: 'daily', 'weekly', 'manual'
-- CREATE INDEX idx_kb_documents_update_frequency ON public.knowledge_base_documents(update_frequency);

COMMENT ON COLUMN public.knowledge_base_documents.last_checked_at IS 'Timestamp of the last time the automated update check was performed for this document source.';
COMMENT ON COLUMN public.knowledge_base_documents.content_hash IS 'SHA-256 hash of the extracted text content, used for change detection.'; 