-- Add has_unread_replies column to contact_messages table
ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS has_unread_replies BOOLEAN DEFAULT false;

-- Add index for faster queries on unread messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_unread 
ON contact_messages(has_unread_replies) 
WHERE has_unread_replies = true;

-- Update the trigger to mark messages as unread when customers reply
CREATE OR REPLACE FUNCTION update_contact_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent contact_message's updated_at timestamp
  -- and mark as unread if the reply is from a customer (not admin)
  UPDATE contact_messages
  SET 
    updated_at = timezone('utc'::text, now()),
    has_unread_replies = CASE 
      WHEN NEW.is_from_admin = false THEN true 
      ELSE has_unread_replies 
    END
  WHERE id = NEW.contact_message_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger already exists from script 009, this just updates the function

-- Add comment for documentation
COMMENT ON COLUMN contact_messages.has_unread_replies IS 'Indicates if there are unread customer replies that admin needs to review';
