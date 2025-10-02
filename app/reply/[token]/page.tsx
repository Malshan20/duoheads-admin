import { Suspense } from "react"
import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import { PublicReplyForm } from "@/components/public-reply-form"

interface PublicReplyPageProps {
  params: {
    token: string
  }
}

export default async function PublicReplyPage({ params }: PublicReplyPageProps) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  console.log("[v0] Fetching message with token:", params.token)

  // Fetch the contact message by reply token
  const { data: message, error: messageError } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("reply_token", params.token)
    .single()

  console.log("[v0] Message fetch result:", { message, messageError })

  if (messageError || !message) {
    console.log("[v0] Message not found, redirecting to 404")
    notFound()
  }

  const { data: replies, error: repliesError } = await supabase
    .from("message_replies")
    .select("*")
    .eq("contact_message_id", message.id)
    .order("created_at", { ascending: true })

  console.log("[v0] Replies fetch result:", { replies, repliesError, messageId: message.id })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Reply to Support Ticket</h1>
            <p className="text-muted-foreground">
              Ticket #{message.ticket_number} - Continue your conversation with our support team
            </p>
          </div>

          <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
            <PublicReplyForm message={message} existingReplies={replies || []} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
