import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/mailersend"
import { createAdminReplyEmailTemplate } from "@/lib/email/templates"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Email notification API called")

    const { messageId, adminReply } = await request.json()

    if (!messageId || !adminReply) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the original message details
    const supabase = await createClient()
    const { data: message, error: messageError } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("id", messageId)
      .single()

    if (messageError || !message) {
      console.error("[v0] Failed to fetch message:", messageError)
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Create reply URL
    const replyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reply/${message.reply_token}`

    // Prepare email data
    const emailData = {
      customerName: message.name,
      customerEmail: message.email,
      originalMessage: message.message,
      adminReply: adminReply,
      replyUrl: replyUrl,
      messageId: messageId,
    }

    // Send email notification
    const emailResult = await sendEmail({
      to: message.email,
      subject: `Reply from Duoheads Support - Re: ${message.subject || "Your Message"}`,
      html: createAdminReplyEmailTemplate(emailData),
      replyTo: "MS_S0QDqE@2nd-brain.app",
    })

    if (!emailResult.success) {
      console.error("[v0] Failed to send email:", emailResult.error)
      return NextResponse.json({ error: "Failed to send email notification" }, { status: 500 })
    }

    // Update message to track email sent
    await supabase
      .from("contact_messages")
      .update({
        last_email_sent: new Date().toISOString(),
        email_notifications_count: (message.email_notifications_count || 0) + 1,
      })
      .eq("id", messageId)

    console.log("[v0] Email notification sent successfully")

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
    })
  } catch (error) {
    console.error("[v0] Email notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
