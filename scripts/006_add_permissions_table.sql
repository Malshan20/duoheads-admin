-- Create permissions table to define what each role can do
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  resource TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission, resource)
);

-- Insert default permissions
INSERT INTO permissions (role, permission, resource) VALUES
-- Super Admin permissions (can do everything)
('super_admin', 'create', 'admin'),
('super_admin', 'read', 'admin'),
('super_admin', 'update', 'admin'),
('super_admin', 'delete', 'admin'),
('super_admin', 'create', 'moderator'),
('super_admin', 'read', 'moderator'),
('super_admin', 'update', 'moderator'),
('super_admin', 'delete', 'moderator'),
('super_admin', 'create', 'super_admin'),
('super_admin', 'read', 'super_admin'),
('super_admin', 'update', 'super_admin'),
('super_admin', 'delete', 'super_admin'),
('super_admin', 'manage', 'settings'),
('super_admin', 'manage', 'system'),

-- Admin permissions (cannot manage super admins)
('admin', 'create', 'moderator'),
('admin', 'read', 'moderator'),
('admin', 'update', 'moderator'),
('admin', 'delete', 'moderator'),
('admin', 'read', 'admin'),
('admin', 'update', 'admin'),
('admin', 'read', 'super_admin'),
('admin', 'manage', 'settings'),

-- Moderator permissions (very limited)
('moderator', 'read', 'moderator'),
('moderator', 'read', 'admin'),
('moderator', 'read', 'super_admin');

-- Add role hierarchy levels for easier comparison
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role_level INTEGER DEFAULT 1;

-- Update role levels
UPDATE admins SET role_level = CASE 
  WHEN role = 'super_admin' THEN 3
  WHEN role = 'admin' THEN 2
  WHEN role = 'moderator' THEN 1
  ELSE 1
END;
