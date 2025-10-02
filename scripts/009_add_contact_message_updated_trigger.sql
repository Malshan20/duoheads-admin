-- Create trigger to update contact_messages.updated_at when a reply is added
CREATE OR REPLACE FUNCTION update_contact_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent contact_message's updated_at timestamp
  UPDATE contact_messages
  SET updated_at = timezone('utc'::text, now())
  WHERE id = NEW.contact_message_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_contact_message_on_reply ON message_replies;

-- Create trigger that fires after a new reply is inserted
CREATE TRIGGER update_contact_message_on_reply
  AFTER INSERT ON message_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_message_timestamp();

-- Also create a general trigger to update contact_messages.updated_at on any update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON contact_messages;

-- Create trigger for contact_messages table
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
