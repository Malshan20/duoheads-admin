-- Create settings table to store all application settings
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid()
    )
  );

-- Insert default settings
INSERT INTO public.settings (key, value, category, description) VALUES
  ('site_name', '"Duoheads"', 'system', 'Name of the application'),
  ('site_description', '"AI-powered education platform"', 'system', 'Description of the application'),
  ('maintenance_mode', 'false', 'system', 'Enable/disable maintenance mode'),
  ('max_users_per_session', '50', 'system', 'Maximum users per session'),
  ('session_timeout', '30', 'system', 'Session timeout in minutes'),
  ('default_language', '"en"', 'system', 'Default language for the application'),
  ('timezone', '"UTC"', 'system', 'Default timezone'),
  
  ('email_notifications', 'true', 'notifications', 'Enable email notifications'),
  ('push_notifications', 'true', 'notifications', 'Enable push notifications'),
  ('sms_notifications', 'false', 'notifications', 'Enable SMS notifications'),
  ('new_user_alerts', 'true', 'notifications', 'Alert on new user registrations'),
  ('order_alerts', 'true', 'notifications', 'Alert on new orders'),
  ('system_alerts', 'true', 'notifications', 'Alert on system errors'),
  ('maintenance_alerts', 'true', 'notifications', 'Alert on maintenance updates'),
  ('admin_email', '"admin@duoheads.com"', 'notifications', 'Admin email for notifications'),
  ('slack_webhook', '""', 'notifications', 'Slack webhook URL'),
  
  ('two_factor_auth', 'true', 'security', 'Require two-factor authentication'),
  ('password_expiry', '"90"', 'security', 'Password expiry in days'),
  ('max_login_attempts', '"5"', 'security', 'Maximum login attempts'),
  ('session_duration', '"24"', 'security', 'Session duration in hours'),
  ('ip_whitelist', '""', 'security', 'IP whitelist (comma-separated)'),
  ('require_strong_passwords', 'true', 'security', 'Require strong passwords'),
  ('log_security_events', 'true', 'security', 'Log security events'),
  ('auto_lockout', 'true', 'security', 'Auto-lockout suspicious activity')
ON CONFLICT (key) DO NOTHING;

-- Create function to update settings
CREATE OR REPLACE FUNCTION update_setting(setting_key TEXT, setting_value JSONB)
RETURNS VOID AS $$
BEGIN
  UPDATE public.settings 
  SET value = setting_value, updated_at = NOW()
  WHERE key = setting_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get settings by category
CREATE OR REPLACE FUNCTION get_settings_by_category(category_name TEXT)
RETURNS TABLE(key TEXT, value JSONB, description TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT s.key, s.value, s.description
  FROM public.settings s
  WHERE s.category = category_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
