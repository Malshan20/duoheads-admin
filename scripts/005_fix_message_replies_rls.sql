-- Fix RLS policies for message_replies table to allow public replies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "message_replies_select_policy" ON message_replies;
DROP POLICY IF EXISTS "message_replies_insert_policy" ON message_replies;
DROP POLICY IF EXISTS "message_replies_update_policy" ON message_replies;

-- Allow public users to view replies for messages they have access to via reply_token
CREATE POLICY "message_replies_select_policy" ON message_replies
FOR SELECT
USING (
  -- Allow if user is authenticated (admin)
  auth.uid() IS NOT NULL
  OR
  -- Allow if the contact message has a reply_token (public access)
  EXISTS (
    SELECT 1 FROM contact_messages 
    WHERE contact_messages.id = message_replies.contact_message_id 
    AND contact_messages.reply_token IS NOT NULL
  )
);

-- Allow public users to insert replies for messages with reply_token
CREATE POLICY "message_replies_insert_policy" ON message_replies
FOR INSERT
WITH CHECK (
  -- Allow if user is authenticated (admin)
  auth.uid() IS NOT NULL
  OR
  -- Allow if inserting a non-admin reply for a message with reply_token
  (
    is_from_admin = false
    AND admin_id IS NULL
    AND EXISTS (
      SELECT 1 FROM contact_messages 
      WHERE contact_messages.id = message_replies.contact_message_id 
      AND contact_messages.reply_token IS NOT NULL
    )
  )
);

-- Allow admins to update their own replies
CREATE POLICY "message_replies_update_policy" ON message_replies
FOR UPDATE
USING (auth.uid() = admin_id)
WITH CHECK (auth.uid() = admin_id);
