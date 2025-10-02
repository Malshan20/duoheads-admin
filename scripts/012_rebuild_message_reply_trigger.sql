-- Complete rebuild of the message reply trigger system
-- This ensures the trigger properly updates contact_messages when replies are added

-- Step 1: Drop existing triggers and functions to start fresh
DROP TRIGGER IF EXISTS update_contact_message_on_reply ON message_replies;
DROP FUNCTION IF EXISTS update_contact_message_timestamp();

-- Step 2: Create the trigger function with proper logic
CREATE OR REPLACE FUNCTION update_contact_message_timestamp()
RETURNS TRIGGER AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  -- Log the trigger execution for debugging
  RAISE NOTICE 'Trigger fired for reply ID: %, contact_message_id: %, is_from_admin: %', 
    NEW.id, NEW.contact_message_id, NEW.is_from_admin;
  
  -- Update the parent contact_message
  UPDATE contact_messages
  SET 
    updated_at = timezone('utc'::text, now()),
    has_unread_replies = CASE 
      WHEN NEW.is_from_admin = false THEN true 
      WHEN NEW.is_from_admin = true THEN false
      ELSE has_unread_replies 
    END
  WHERE id = NEW.contact_message_id;
  
  -- Check if the update actually happened
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RAISE NOTICE 'Updated % row(s) in contact_messages', rows_affected;
  
  IF rows_affected = 0 THEN
    RAISE WARNING 'No contact_message found with id: %', NEW.contact_message_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the trigger
CREATE TRIGGER update_contact_message_on_reply
  AFTER INSERT ON message_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_message_timestamp();

-- Step 4: Add helpful comments
COMMENT ON FUNCTION update_contact_message_timestamp() IS 
  'Automatically updates contact_messages.updated_at and has_unread_replies when a reply is added. Sets has_unread_replies=true for customer replies, false for admin replies.';

COMMENT ON TRIGGER update_contact_message_on_reply ON message_replies IS 
  'Fires after each reply insert to update the parent contact message';

-- Step 5: Verify the trigger was created
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_contact_message_on_reply'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✓ Trigger successfully created';
  ELSE
    RAISE EXCEPTION '✗ Trigger creation failed';
  END IF;
END $$;
