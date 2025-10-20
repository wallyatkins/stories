ALTER TABLE responses
    ADD COLUMN status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN processed_manifest TEXT,
    ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_responses_status ON responses (status);

UPDATE responses SET status = 'processed' WHERE status IS NULL OR status = '';
