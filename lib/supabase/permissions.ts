import { createClient } from "@/lib/supabase/client"

export interface Permission {
  id: string
  role: string
  permission: string
  resource: string
}

export interface RoleHierarchy {
  super_admin: 3
  admin: 2
  moderator: 1
}

export const ROLE_LEVELS: RoleHierarchy = {
  super_admin: 3,
  admin: 2,
  moderator: 1,
}

// Check if current user has permission to perform action on target role
export async function canManageRole(currentUserRole: string, targetRole: string, action: string): Promise<boolean> {
  // Get current user's role level
  const currentLevel = ROLE_LEVELS[currentUserRole as keyof RoleHierarchy] || 0
  const targetLevel = ROLE_LEVELS[targetRole as keyof RoleHierarchy] || 0

  // Super admins can manage anyone (add, edit, delete permissions for admins and moderators)
  if (currentUserRole === "super_admin") {
    return true
  }

  // Admins can only manage moderators (add, edit, delete permissions for moderators only)
  if (currentUserRole === "admin") {
    return targetRole === "moderator"
  }

  // Moderators cannot manage anyone (read-only access)
  if (currentUserRole === "moderator") {
    return false
  }

  return false
}

// Get all permissions for a role
export async function getRolePermissions(role: string): Promise<Permission[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("permissions").select("*").eq("role", role)

  if (error) {
    console.error("Error fetching permissions:", error)
    return []
  }

  return data || []
}

// Get available roles that current user can assign
export async function getAssignableRoles(currentUserRole: string): Promise<string[]> {
  // Super admins can assign any role including other super admins
  if (currentUserRole === "super_admin") {
    return ["super_admin", "admin", "moderator"]
  }

  // Admins can only assign moderator roles
  if (currentUserRole === "admin") {
    return ["moderator"]
  }

  // Moderators cannot assign any roles
  return []
}

// Check if user can view admin management
export function canViewAdminManagement(userRole: string): boolean {
  return ["super_admin", "admin", "moderator"].includes(userRole)
}

// Check specific action permissions
export function canPerformAdminAction(
  currentUserRole: string,
  targetRole: string,
  action: "create" | "edit" | "delete" | "view",
): boolean {
  if (action === "view") {
    // All admin roles can view
    return canViewAdminManagement(currentUserRole)
  }

  if (currentUserRole === "super_admin") {
    // Super admins can do everything to everyone
    return true
  }

  if (currentUserRole === "admin") {
    // Admins can only manage moderators
    return targetRole === "moderator"
  }

  // Moderators cannot perform any management actions
  return false
}

// Check if current user has permission to perform action on specific admin
export async function canManageAdmin(
  currentUserRole: string,
  targetAdminRole: string,
  action: string,
): Promise<boolean> {
  return canManageRole(currentUserRole, targetAdminRole, action)
}
