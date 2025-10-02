import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { MessageReplyForm } from "@/components/admin/message-reply-form"

interface ReplyPageProps {
  params: {
    id: string
  }
}

export default async function ReplyPage({ params }: ReplyPageProps) {
  const supabase = await createClient()

  // Check if user is authenticated and is an admin
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    redirect("/auth/login")
  }

  // Check if user is an admin
  const { data: adminData } = await supabase.from("admins").select("*").eq("user_id", userData.user.id).single()

  if (!adminData) {
    redirect("/admin")
  }

  // Fetch the contact message
  const { data: message, error: messageError } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("id", params.id)
    .single()

  if (messageError || !message) {
    notFound()
  }

  if (message.has_unread_replies || message.status === "unread") {
    await supabase
      .from("contact_messages")
      .update({
        has_unread_replies: false,
        status: message.status === "unread" ? "read" : message.status,
      })
      .eq("id", params.id)
  }

  // Fetch existing replies
  console.log("[v0] Fetching replies for message ID:", params.id)

  const { data: replies, error: repliesError } = await supabase
    .from("message_replies")
    .select("*")
    .eq("contact_message_id", params.id)
    .order("created_at", { ascending: true })

  console.log("[v0] Replies query result:", { replies, repliesError })

  if (repliesError) {
    console.error("[v0] Error fetching replies:", repliesError)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Reply to Message</h2>
          <p className="text-muted-foreground mt-1">
            Ticket #{message.ticket_number} - {message.subject}
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
        <MessageReplyForm message={message} existingReplies={replies || []} />
      </Suspense>
    </div>
  )
}
