ALTER TABLE prompts
    ADD COLUMN status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN processed_manifest TEXT,
    ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts (status);

UPDATE prompts SET status = 'processed' WHERE status IS NULL OR status = '';
