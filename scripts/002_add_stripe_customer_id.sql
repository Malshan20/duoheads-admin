-- Add stripe_customer_id to profiles table
-- This field will link Supabase users to Stripe customers

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id);

-- Update existing users with mock stripe customer IDs for testing
-- In production, these would be populated via webhook or API calls
UPDATE public.profiles 
SET stripe_customer_id = 'cus_mock_' || substr(id::text, 1, 8)
WHERE stripe_customer_id IS NULL;
