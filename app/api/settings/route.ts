import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getAllSettings, updateMultipleSettings } from "@/lib/supabase/settings"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: admin } = await supabase.from("admins").select("id").eq("user_id", user.id).single()

    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const settings = await getAllSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: admin } = await supabase.from("admins").select("id").eq("user_id", user.id).single()

    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { settings } = await request.json()

    await updateMultipleSettings(settings)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
