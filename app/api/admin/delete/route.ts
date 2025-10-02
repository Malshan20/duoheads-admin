import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const ROLE_LEVELS = {
  super_admin: 3,
  admin: 2,
  moderator: 1,
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase.from("admins").select("role").eq("user_id", user.id).single()

    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get("id")
    const currentUserRole = searchParams.get("currentUserRole")
    const targetAdminRole = searchParams.get("targetAdminRole")

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 })
    }

    if (currentUserRole && targetAdminRole) {
      // Super admins can delete any role (super_admin, admin, moderator)
      if (currentUserRole === "super_admin") {
        // Super admins can delete anyone
      } else if (currentUserRole === "admin") {
        // Admins can only delete moderators
        if (targetAdminRole !== "moderator") {
          return NextResponse.json(
            {
              error: "Admins can only delete moderator accounts",
            },
            { status: 403 },
          )
        }
      } else {
        // Moderators cannot delete any accounts
        return NextResponse.json(
          {
            error: "You do not have permission to delete admin accounts",
          },
          { status: 403 },
        )
      }
    }

    const adminClient = createAdminClient()

    // Get admin details first
    const { data: admin, error: fetchError } = await adminClient
      .from("admins")
      .select("user_id")
      .eq("id", adminId)
      .single()

    if (fetchError || !admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    // Delete admin record
    const { error: adminError } = await adminClient.from("admins").delete().eq("id", adminId)

    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 400 })
    }

    // Delete user from auth (this will cascade to profiles)
    const { error: authError } = await adminClient.auth.admin.deleteUser(admin.user_id)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      // Continue anyway, admin record is already deleted
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting admin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
