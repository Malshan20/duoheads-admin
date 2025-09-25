-- Fix RLS policies for public reply access
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow public read access to messages with reply token" ON contact_messages;
DROP POLICY IF EXISTS "Allow public read access to replies for messages with reply token" ON message_replies;
DROP POLICY IF EXISTS "Allow public insert replies for messages with reply token" ON message_replies;

-- Create comprehensive policies for public access
CREATE POLICY "Public can read messages with reply token"
ON contact_messages FOR SELECT
USING (reply_token IS NOT NULL);

CREATE POLICY "Public can read replies for messages with reply token"
ON message_replies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contact_messages 
    WHERE contact_messages.id = message_replies.contact_message_id 
    AND contact_messages.reply_token IS NOT NULL
  )
);

CREATE POLICY "Public can insert replies for messages with reply token"
ON message_replies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contact_messages 
    WHERE contact_messages.id = message_replies.contact_message_id 
    AND contact_messages.reply_token IS NOT NULL
  )
);

-- Ensure anon role has necessary permissions
GRANT SELECT ON contact_messages TO anon;
GRANT SELECT, INSERT ON message_replies TO anon;
GRANT USAGE ON SEQUENCE message_replies_id_seq TO anon;

-- Add debugging function to test access
CREATE OR REPLACE FUNCTION test_public_reply_access(token_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'message_found', EXISTS(SELECT 1 FROM contact_messages WHERE reply_token = token_param),
    'can_read_message', (SELECT count(*) FROM contact_messages WHERE reply_token = token_param) > 0,
    'can_read_replies', (
      SELECT count(*) FROM message_replies mr 
      JOIN contact_messages cm ON cm.id = mr.contact_message_id 
      WHERE cm.reply_token = token_param
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to anon
GRANT EXECUTE ON FUNCTION test_public_reply_access(text) TO anon;
