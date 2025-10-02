import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/mailersend"
import { createChatEndedEmailTemplate } from "@/lib/email/templates"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] End chat API called")

    const { messageId, endedBy } = await request.json()

    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the message details
    const { data: message, error: messageError } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("id", messageId)
      .single()

    if (messageError || !message) {
      console.error("[v0] Failed to fetch message:", messageError)
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Check if already closed
    if (message.status === "closed") {
      return NextResponse.json({ error: "Chat is already closed" }, { status: 400 })
    }

    // Update message status to closed
    const { error: updateError } = await supabase
      .from("contact_messages")
      .update({ status: "closed" })
      .eq("id", messageId)

    if (updateError) {
      console.error("[v0] Failed to update message status:", updateError)
      return NextResponse.json({ error: "Failed to close chat" }, { status: 500 })
    }

    console.log("[v0] Chat closed successfully, sending email notification")

    // Send email notification to customer
    const emailResult = await sendEmail({
      to: message.email,
      subject: `Chat Resolved - ${message.subject || "Your Support Request"}`,
      html: createChatEndedEmailTemplate({
        customerName: message.name,
        ticketNumber: message.ticket_number,
        subject: message.subject || "Your Support Request",
      }),
      replyTo: "MS_S0QDqE@2nd-brain.app",
    })

    if (!emailResult.success) {
      console.error("[v0] Failed to send email:", emailResult.error)
      // Don't fail the request if email fails, chat is still closed
    } else {
      console.log("[v0] Chat ended email sent successfully")
    }

    return NextResponse.json({
      success: true,
      message: "Chat ended successfully",
      emailSent: emailResult.success,
    })
  } catch (error) {
    console.error("[v0] End chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
