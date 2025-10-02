-- Add ticket_number column to contact_messages table
-- This will generate unique ticket numbers for support tracking

-- Add the ticket_number column
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS ticket_number text UNIQUE;

-- Create a function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
    ticket_num text;
    counter integer := 1;
BEGIN
    -- Generate ticket number in format: TKT-YYYYMMDD-XXXX
    LOOP
        ticket_num := 'TKT-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(counter::text, 4, '0');
        
        -- Check if this ticket number already exists
        IF NOT EXISTS (SELECT 1 FROM public.contact_messages WHERE ticket_number = ticket_num) THEN
            RETURN ticket_num;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate ticket numbers for new messages
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_ticket_number ON public.contact_messages;
CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON public.contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- Update existing messages to have ticket numbers
UPDATE public.contact_messages 
SET ticket_number = generate_ticket_number()
WHERE ticket_number IS NULL;
