import { createClient } from "@/lib/supabase/admin"
import { createCustomerReplyNotificationTemplate } from "./templates"
import { sendEmail } from "./mailersend"

export interface EmailWebhookData {
  from_email: string
  subject: string
  text_content: string
  html_content?: string
  in_reply_to?: string
  message_id: string
  timestamp: string
}

export async function processIncomingEmailReply(webhookData: EmailWebhookData) {
  console.log("[v0] Processing incoming email reply:", webhookData)

  const supabase = createClient()

  try {
    // Find the original message by email address
    const { data: message, error: messageError } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("email", webhookData.from_email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (messageError || !message) {
      console.error("[v0] Could not find original message for email:", webhookData.from_email)
      throw new Error("Original message not found")
    }

    // Create a new reply from the email
    const { data: newReply, error: replyError } = await supabase
      .from("message_replies")
      .insert({
        contact_message_id: message.id,
        reply_content: webhookData.text_content,
        is_from_admin: false,
        admin_id: null,
        email_source: true,
        email_message_id: webhookData.message_id,
      })
      .select()
      .single()

    if (replyError) {
      console.error("[v0] Failed to save email reply:", replyError)
      throw new Error("Failed to save reply")
    }

    // Log the email in email_logs table
    await supabase.from("email_logs").insert({
      message_id: message.id,
      email_type: "customer_reply",
      recipient_email: "MS_S0QDqE@2nd-brain.app",
      sender_email: webhookData.from_email,
      subject: webhookData.subject,
      email_content: webhookData.text_content,
      email_message_id: webhookData.message_id,
      status: "received",
    })

    // Notify admins about the new customer reply
    const adminEmails = await getAdminEmails()
    if (adminEmails.length > 0) {
      const conversationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/contact-messages/${message.id}/reply`

      for (const adminEmail of adminEmails) {
        await sendEmail({
          to: adminEmail,
          subject: `New Customer Reply - ${message.subject}`,
          html: createCustomerReplyNotificationTemplate({
            customerName: message.name,
            customerEmail: message.email,
            replyMessage: webhookData.text_content,
            conversationUrl,
          }),
        })
      }
    }

    console.log("[v0] Email reply processed successfully")
    return { success: true, replyId: newReply.id }
  } catch (error) {
    console.error("[v0] Email reply processing error:", error)
    throw error
  }
}

async function getAdminEmails(): Promise<string[]> {
  const supabase = createClient()

  const { data: admins, error } = await supabase.from("admin_users").select("email").eq("is_active", true)

  if (error) {
    console.error("[v0] Failed to fetch admin emails:", error)
    return []
  }

  return admins.map((admin) => admin.email).filter(Boolean)
}
