import { createClient } from "@/lib/supabase/client"
import { canManageRole } from "./permissions"

export interface Admin {
  id: string
  user_id: string
  role: string
  created_at: string
  updated_at: string
  // Joined data from auth.users and profiles
  email?: string
  full_name?: string
  username?: string
  last_sign_in_at?: string
}

export interface CreateAdminData {
  email: string
  password: string
  full_name?: string
  role?: string
}

export interface UpdateAdminData {
  role?: string
  full_name?: string
}

// Get all admins with user details
export async function getAllAdmins(): Promise<Admin[]> {
  const supabase = createClient()

  console.log("[v0] Fetching admins from database...")

  const { data, error } = await supabase.from("admins").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching admins:", error)
    throw new Error(`Could not find a relationship between 'admins' and 'profiles' in the schema cache`)
  }

  console.log("[v0] Found admins:", data?.length || 0)

  if (!data || data.length === 0) {
    console.log("[v0] No admins found in database")
    return []
  }

  console.log("[v0] Fetching profile details for admins...")

  const adminsWithDetails = await Promise.all(
    data.map(async (admin) => {
      console.log("[v0] Fetching profile for user_id:", admin.user_id)

      // Try to get user details from profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, username, email")
        .eq("id", admin.user_id)
        .single()

      if (profileError) {
        console.log("[v0] Profile not found for user_id:", admin.user_id, profileError)
      }

      return {
        ...admin,
        full_name: profile?.full_name || "Unknown",
        username: profile?.username || "unknown",
        email: profile?.email || "unknown@example.com",
      }
    }),
  )

  console.log("[v0] Returning admins with details:", adminsWithDetails.length)
  return adminsWithDetails
}

// Create new admin user
export async function createAdmin(
  adminData: CreateAdminData,
  currentUserRole: string,
): Promise<{ success: boolean; error?: string; admin?: Admin }> {
  // Check if current user can create this role
  const canCreate = await canManageRole(currentUserRole, adminData.role || "admin", "create")

  if (!canCreate) {
    return { success: false, error: "You do not have permission to create this role" }
  }

  try {
    const response = await fetch("/api/admin/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...adminData, currentUserRole }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || "Failed to create admin" }
    }

    return {
      success: true,
      admin: result.admin,
    }
  } catch (error) {
    return { success: false, error: "Network error occurred" }
  }
}

// Update admin
export async function updateAdmin(
  adminId: string,
  updates: UpdateAdminData,
  currentUserRole: string,
  targetAdminRole: string,
): Promise<{ success: boolean; error?: string }> {
  // Check if current user can update this admin
  const canUpdate = await canManageRole(currentUserRole, targetAdminRole, "update")

  if (!canUpdate) {
    return { success: false, error: "You do not have permission to update this admin" }
  }

  // If changing role, check if user can assign the new role
  if (updates.role && updates.role !== targetAdminRole) {
    const canAssignRole = await canManageRole(currentUserRole, updates.role, "create")
    if (!canAssignRole) {
      return { success: false, error: "You do not have permission to assign this role" }
    }
  }

  const supabase = createClient()

  try {
    // Update admin record
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.role) {
      updateData.role = updates.role
      updateData.role_level = updates.role === "super_admin" ? 3 : updates.role === "admin" ? 2 : 1
    }

    const { error: adminError } = await supabase.from("admins").update(updateData).eq("id", adminId)

    if (adminError) {
      return { success: false, error: adminError.message }
    }

    // Update profile if full_name is provided
    if (updates.full_name) {
      const { data: admin } = await supabase.from("admins").select("user_id").eq("id", adminId).single()

      if (admin) {
        await supabase.from("profiles").update({ full_name: updates.full_name }).eq("id", admin.user_id)
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: "Unexpected error occurred" }
  }
}

// Delete admin
export async function deleteAdmin(
  adminId: string,
  currentUserRole: string,
  targetAdminRole: string,
): Promise<{ success: boolean; error?: string }> {
  // Check if current user can delete this admin
  const canDelete = await canManageRole(currentUserRole, targetAdminRole, "delete")

  if (!canDelete) {
    return { success: false, error: "You do not have permission to delete this admin" }
  }

  try {
    const response = await fetch(
      `/api/admin/delete?id=${adminId}&currentUserRole=${currentUserRole}&targetAdminRole=${targetAdminRole}`,
      {
        method: "DELETE",
      },
    )

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || "Failed to delete admin" }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: "Network error occurred" }
  }
}

// Check if current user is admin
export async function checkAdminStatus(): Promise<{ isAdmin: boolean; role?: string }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { isAdmin: false }
  }

  const { data: admin } = await supabase.from("admins").select("role").eq("user_id", user.id).single()

  return {
    isAdmin: !!admin,
    role: admin?.role,
  }
}

// Get admin statistics
export async function getAdminStats() {
  const supabase = createClient()

  console.log("[v0] Fetching admin statistics...")

  const [{ count: totalAdmins }, { data: recentAdmins }, { data: superAdmins }, { data: regularAdmins }] =
    await Promise.all([
      supabase.from("admins").select("*", { count: "exact", head: true }),
      supabase
        .from("admins")
        .select("*")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("admins").select("*").eq("role", "super_admin"),
      supabase.from("admins").select("*").eq("role", "admin"),
    ])

  console.log("[v0] Admin stats:", {
    totalAdmins: totalAdmins || 0,
    recentAdmins: recentAdmins?.length || 0,
    superAdmins: superAdmins?.length || 0,
    regularAdmins: regularAdmins?.length || 0,
  })

  return {
    totalAdmins: totalAdmins || 0,
    recentAdmins: recentAdmins?.length || 0,
    superAdmins: superAdmins?.length || 0,
    regularAdmins: regularAdmins?.length || 0,
  }
}
