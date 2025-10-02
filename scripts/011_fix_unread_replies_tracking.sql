-- Fix the trigger to properly handle unread replies tracking
-- This replaces the function from scripts 009 and 010

CREATE OR REPLACE FUNCTION update_contact_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent contact_message's updated_at timestamp
  -- Mark as unread if reply is from customer, mark as read if from admin
  UPDATE contact_messages
  SET 
    updated_at = timezone('utc'::text, now()),
    has_unread_replies = CASE 
      WHEN NEW.is_from_admin = false THEN true 
      WHEN NEW.is_from_admin = true THEN false
      ELSE has_unread_replies 
    END
  WHERE id = NEW.contact_message_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists (it should from script 009)
DROP TRIGGER IF EXISTS update_contact_message_on_reply ON message_replies;

CREATE TRIGGER update_contact_message_on_reply
  AFTER INSERT ON message_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_message_timestamp();

-- Add comment for documentation
COMMENT ON FUNCTION update_contact_message_timestamp() IS 'Updates parent message timestamp and unread status when replies are added';
