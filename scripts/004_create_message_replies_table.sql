-- Create message_replies table to store admin responses to contact messages
CREATE TABLE IF NOT EXISTS message_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_message_id uuid REFERENCES contact_messages(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reply_content text NOT NULL,
  is_from_admin boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_replies_contact_message_id ON message_replies(contact_message_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_admin_id ON message_replies(admin_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_created_at ON message_replies(created_at);

-- Enable RLS
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for message_replies
CREATE POLICY "Admins can view all message replies" ON message_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert message replies" ON message_replies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their own message replies" ON message_replies
  FOR UPDATE USING (
    admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_message_replies_updated_at
  BEFORE UPDATE ON message_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_message_replies_updated_at();

-- Add reply_token column to contact_messages for public access
ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS reply_token text UNIQUE;

-- Create function to generate reply token
CREATE OR REPLACE FUNCTION generate_reply_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate reply token for new messages
CREATE OR REPLACE FUNCTION set_reply_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reply_token IS NULL THEN
    NEW.reply_token = generate_reply_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_contact_message_reply_token
  BEFORE INSERT ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_reply_token();

-- Update existing messages to have reply tokens
UPDATE contact_messages 
SET reply_token = generate_reply_token() 
WHERE reply_token IS NULL;
