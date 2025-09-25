-- Fix RLS policies for contact_messages table to allow public access via reply_token

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "contact_messages_select_policy" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_insert_policy" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_update_policy" ON contact_messages;

-- Allow public users to view contact messages with reply_token
CREATE POLICY "contact_messages_select_policy" ON contact_messages
FOR SELECT
USING (
  -- Allow if user is authenticated (admin)
  auth.uid() IS NOT NULL
  OR
  -- Allow if the message has a reply_token (public access)
  reply_token IS NOT NULL
);

-- Allow public users to insert new contact messages
CREATE POLICY "contact_messages_insert_policy" ON contact_messages
FOR INSERT
WITH CHECK (true); -- Anyone can submit contact messages

-- Allow admins to update contact messages
CREATE POLICY "contact_messages_update_policy" ON contact_messages
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
