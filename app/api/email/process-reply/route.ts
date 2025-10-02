import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Processing email reply webhook")

    // This will be called by MailerSend webhook when someone replies to an email
    const body = await request.json()
    console.log("[v0] Email reply webhook data:", body)

    // Extract email data (format depends on MailerSend webhook structure)
    const { from_email, subject, text_content, html_content, in_reply_to, message_id } = body

    if (!from_email || !text_content) {
      return NextResponse.json({ error: "Missing required email data" }, { status: 400 })
    }

    // Find the original message by email address
    const supabase = createClient()
    const { data: message, error: messageError } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("email", from_email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (messageError || !message) {
      console.error("[v0] Could not find original message for email:", from_email)
      return NextResponse.json({ error: "Original message not found" }, { status: 404 })
    }

    // Create a new reply from the email
    const { error: replyError } = await supabase.from("message_replies").insert({
      contact_message_id: message.id,
      reply_content: text_content,
      is_from_admin: false,
      admin_id: null,
      created_at: new Date().toISOString(),
    })

    if (replyError) {
      console.error("[v0] Failed to save email reply:", replyError)
      return NextResponse.json({ error: "Failed to save reply" }, { status: 500 })
    }

    console.log("[v0] Email reply processed successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Email reply processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
