-- Create admin management functions and policies
-- This script sets up the admin table and related functionality

-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'admin'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id),
  CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins table
CREATE POLICY "Allow authenticated users to view all admins" ON public.admins FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update all admins" ON public.admins FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert admins" ON public.admins FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete admins" ON public.admins FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = user_uuid
  );
END;
$$;

-- Create function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role text;
BEGIN
  SELECT role INTO admin_role 
  FROM public.admins 
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(admin_role, 'none');
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
