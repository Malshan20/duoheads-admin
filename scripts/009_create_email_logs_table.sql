-- Create email_logs table to track all email communications
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES contact_messages(id) ON DELETE CASCADE,
    email_type VARCHAR(50) NOT NULL, -- 'admin_reply', 'customer_reply', 'notification'
    recipient_email VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    email_content TEXT,
    email_message_id TEXT, -- External email service message ID
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'bounced'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

-- Create indexes for email logs
CREATE INDEX IF NOT EXISTS idx_email_logs_message_id ON email_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Enable RLS on email_logs table
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_logs
CREATE POLICY "Admins can view all email logs" ON email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert email logs" ON email_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update email logs" ON email_logs
    FOR UPDATE USING (true);

-- Add comments for documentation
COMMENT ON TABLE email_logs IS 'Tracks all email communications related to contact messages';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: admin_reply, customer_reply, notification';
COMMENT ON COLUMN email_logs.status IS 'Email delivery status: sent, delivered, failed, bounced';
COMMENT ON COLUMN email_logs.email_message_id IS 'External email service message ID for tracking';

-- Log the schema update
INSERT INTO schema_migrations (version, description, applied_at) 
VALUES ('009', 'Create email_logs table for tracking email communications', NOW())
ON CONFLICT (version) DO NOTHING;
