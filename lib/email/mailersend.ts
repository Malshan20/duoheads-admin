export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    console.log("[v0] Sending email to:", options.to)

    const apiToken = process.env.MAILERSEND_API_TOKEN
    const fromEmail = process.env.MAILERSEND_FROM_EMAIL || "noreply@yourdomain.com"
    const fromName = process.env.MAILERSEND_FROM_NAME || "Duoheads"

    if (!apiToken) {
      throw new Error("MAILERSEND_API_TOKEN environment variable is not set")
    }

    const payload = {
      from: {
        email: fromEmail,
        name: fromName,
      },
      to: [
        {
          email: options.to,
        },
      ],
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      reply_to: {
        email: options.replyTo || fromEmail,
      },
    }

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`MailerSend API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    console.log("[v0] Email sent successfully via MailerSend API")

    return {
      success: true,
      messageId: result.message_id || "sent",
    }
  } catch (error) {
    console.error("[v0] Email sending failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function verifyEmailConnection() {
  try {
    const apiToken = process.env.MAILERSEND_API_TOKEN

    if (!apiToken) {
      console.error("[v0] MAILERSEND_API_TOKEN environment variable is not set")
      return false
    }

    // Simple API health check
    const response = await fetch("https://api.mailersend.com/v1/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })

    if (response.ok) {
      console.log("[v0] MailerSend API connection verified successfully")
      return true
    } else {
      console.error("[v0] MailerSend API connection failed:", response.status)
      return false
    }
  } catch (error) {
    console.error("[v0] MailerSend API connection failed:", error)
    return false
  }
}
