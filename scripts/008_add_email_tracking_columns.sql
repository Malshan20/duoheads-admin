-- Add email tracking columns to contact_messages table
ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS last_email_sen```sql file="scripts/008_add_email_tracking_columns.sql"
-- Add email tracking columns to contact_messages table
ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_notifications_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true;

-- Add email source tracking to message_replies table
ALTER TABLE message_replies 
ADD COLUMN IF NOT EXISTS email_source BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_message_id TEXT;

-- Create index for email tracking queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_email_tracking 
ON contact_messages(last_email_sent, email_notifications_count);

CREATE INDEX IF NOT EXISTS idx_message_replies_email_source 
ON message_replies(email_source, email_message_id);

-- Add comments for documentation
COMMENT ON COLUMN contact_messages.last_email_sent IS 'Timestamp of the last email notification sent to customer';
COMMENT ON COLUMN contact_messages.email_notifications_count IS 'Total number of email notifications sent for this message';
COMMENT ON COLUMN contact_messages.email_enabled IS 'Whether email notifications are enabled for this message';
COMMENT ON COLUMN message_replies.email_source IS 'Whether this reply came from an email response';
COMMENT ON COLUMN message_replies.email_message_id IS 'Email message ID for tracking email replies';

-- Update existing messages to enable email by default
UPDATE contact_messages 
SET email_enabled = true 
WHERE email_enabled IS NULL;

-- Log the schema update
INSERT INTO schema_migrations (version, description, applied_at) 
VALUES ('008', 'Add email tracking columns to contact_messages and message_replies', NOW())
ON CONFLICT (version) DO NOTHING;
