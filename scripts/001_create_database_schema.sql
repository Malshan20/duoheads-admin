-- Create all tables for Duoheads admin panel
-- This script creates the complete database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscriptions table first (referenced by profiles)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  features jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id)
);

-- Create subjects table (referenced by other tables)
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  color text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);

-- Create units table (referenced by other tables)
CREATE TABLE IF NOT EXISTS public.units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject_id uuid NOT NULL,
  description text,
  order_index integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT units_pkey PRIMARY KEY (id),
  CONSTRAINT units_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
);

-- Create profiles table (references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  bio text,
  school text,
  major text,
  grad_year text,
  age numeric CHECK (age > 0::numeric),
  subscription_tier character varying DEFAULT 'Seedling',
  subscription_status character varying DEFAULT 'active',
  subscription_start_date timestamp with time zone,
  subscription_end_date timestamp with time zone,
  paddle_customer_id character varying,
  paddle_subscription_id character varying,
  subscription_id uuid,
  paddle_transaction_id text,
  subscription_plan text DEFAULT 'free',
  last_payment_date timestamp with time zone,
  subscription_current_period_end timestamp with time zone,
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_email character varying NOT NULL,
  customer_name character varying NOT NULL,
  product_name character varying NOT NULL,
  amount numeric NOT NULL,
  currency character varying DEFAULT 'USD',
  paddle_transaction_id character varying,
  status character varying DEFAULT 'pending',
  tracking_number character varying,
  shipping_status character varying DEFAULT 'processing',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  price_amount numeric,
  user_id uuid,
  customer_phone character varying,
  billing_address_line1 character varying,
  billing_address_line2 character varying,
  billing_city character varying,
  billing_state character varying,
  billing_postal_code character varying,
  billing_country character varying,
  shipping_address_line1 character varying,
  shipping_address_line2 character varying,
  shipping_city character varying,
  shipping_state character varying,
  shipping_postal_code character varying,
  shipping_country character varying,
  customer_date_of_birth date,
  special_instructions text,
  same_as_billing boolean DEFAULT false,
  paddle_checkout_id numeric,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create tutor_sessions table
CREATE TABLE IF NOT EXISTS public.tutor_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  topic text,
  created_at timestamp with time zone DEFAULT now(),
  last_updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tutor_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create tutor_messages table
CREATE TABLE IF NOT EXISTS public.tutor_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  audio_url text,
  CONSTRAINT tutor_messages_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.tutor_sessions(id)
);

-- Create daily_voice_tutor_usage table
CREATE TABLE IF NOT EXISTS public.daily_voice_tutor_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds_today integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_voice_tutor_usage_pkey PRIMARY KEY (id),
  CONSTRAINT daily_voice_tutor_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create stress_relief_chats table
CREATE TABLE IF NOT EXISTS public.stress_relief_chats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  message text NOT NULL,
  response text NOT NULL,
  age_group text NOT NULL CHECK (age_group = ANY (ARRAY['primary'::text, 'teen'::text, 'college'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stress_relief_chats_pkey PRIMARY KEY (id),
  CONSTRAINT stress_relief_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id),
  CONSTRAINT contact_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  subject_id uuid,
  title text NOT NULL,
  type text NOT NULL,
  file_path text,
  content text,
  summary text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  public_url text,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT documents_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
);

-- Add foreign key constraints for subjects table
ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_voice_tutor_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stress_relief_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access (allow all operations for authenticated users)
-- In a production environment, you would want more restrictive policies

-- Profiles policies
CREATE POLICY "Allow authenticated users to view all profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update all profiles" ON public.profiles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert profiles" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete profiles" ON public.profiles FOR DELETE USING (auth.role() = 'authenticated');

-- Orders policies
CREATE POLICY "Allow authenticated users to view all orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update all orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert orders" ON public.orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete orders" ON public.orders FOR DELETE USING (auth.role() = 'authenticated');

-- Contact messages policies
CREATE POLICY "Allow authenticated users to view all contact messages" ON public.contact_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update all contact messages" ON public.contact_messages FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete contact messages" ON public.contact_messages FOR DELETE USING (auth.role() = 'authenticated');

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users full access to tutor_sessions" ON public.tutor_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to tutor_messages" ON public.tutor_messages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to daily_voice_tutor_usage" ON public.daily_voice_tutor_usage FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to stress_relief_chats" ON public.stress_relief_chats FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to subjects" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to documents" ON public.documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to subscriptions" ON public.subscriptions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to units" ON public.units FOR ALL USING (auth.role() = 'authenticated');
