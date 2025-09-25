import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const ROLE_LEVELS = {
  super_admin: 3,
  admin: 2,
  moderator: 1,
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { email, password, full_name, role = "admin", currentUserRole } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Super admins can create any role (super_admin, admin, moderator)
    if (currentUserRole === "super_admin") {
      // Super admins can create anyone
    } else if (currentUserRole === "admin") {
      // Admins can only create moderators
      if (role !== "moderator") {
        return NextResponse.json(
          {
            error: "Admins can only create moderator accounts",
          },
          { status: 403 },
        )
      }
    } else {
      // Moderators cannot create any accounts
      return NextResponse.json(
        {
          error: "You do not have permission to create admin accounts",
        },
        { status: 403 },
      )
    }

    const adminClient = createAdminClient()

    // Create user in auth.users
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Failed to create user" }, { status: 400 })
    }

    // Create profile
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: authData.user.id,
      email,
      full_name,
      username: email.split("@")[0], // Use email prefix as username
    })

    if (profileError) {
      console.error("Error creating profile:", profileError)
      // Continue anyway, profile creation is not critical for admin functionality
    }

    const targetLevel = ROLE_LEVELS[role as keyof typeof ROLE_LEVELS] || 1

    const { data: adminRecord, error: adminError } = await adminClient
      .from("admins")
      .insert({
        user_id: authData.user.id,
        role,
        role_level: targetLevel,
      })
      .select()
      .single()

    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      admin: {
        ...adminRecord,
        email,
        full_name,
      },
    })
  } catch (error) {
    console.error("Error creating admin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
