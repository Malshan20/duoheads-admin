"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ContactMessage, MessageReply } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { User, Send, Shield, MessageCircle, AtSign } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface PublicReplyFormProps {
  message: ContactMessage
  existingReplies: MessageReply[]
}

export function PublicReplyForm({ message, existingReplies }: PublicReplyFormProps) {
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replies, setReplies] = useState<MessageReply[]>(existingReplies)
  const { toast } = useToast()

  console.log("[v0] PublicReplyForm initialized with:", {
    messageId: message.id,
    existingRepliesCount: existingReplies.length,
    repliesCount: replies.length,
  })

  const refreshReplies = async () => {
    const supabase = createClient()
    const { data: freshReplies, error } = await supabase
      .from("message_replies")
      .select("*")
      .eq("contact_message_id", message.id)
      .order("created_at", { ascending: true })

    console.log("[v0] Refreshed replies:", { freshReplies, error })

    if (!error && freshReplies) {
      setReplies(freshReplies)
    }
  }

  useEffect(() => {
    refreshReplies()
  }, [message.id])

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    console.log("[v0] Submitting reply:", {
      messageId: message.id,
      content: replyContent.trim(),
    })

    try {
      const { data, error } = await supabase
        .from("message_replies")
        .insert({
          contact_message_id: message.id,
          admin_id: null, // No admin ID for public replies
          reply_content: replyContent.trim(),
          is_from_admin: false,
        })
        .select()

      console.log("[v0] Reply submission result:", { data, error })

      if (error) throw error

      toast({
        title: "Reply sent",
        description: "Your reply has been sent to our support team.",
      })

      setReplyContent("")
      await refreshReplies()
    } catch (error) {
      console.error("[v0] Error sending reply:", error)
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "unread":
        return "destructive"
      case "read":
        return "default"
      case "archived":
        return "secondary"
      default:
        return "outline"
    }
  }

  const allMessages = [
    {
      id: `original-${message.id}`,
      content: message.message,
      is_from_admin: false,
      created_at: message.created_at,
      sender_name: "You",
      is_original: true,
      email_source: false,
    },
    ...replies.map((reply) => ({
      id: reply.id,
      content: reply.reply_content,
      is_from_admin: reply.is_from_admin,
      created_at: reply.created_at,
      sender_name: reply.is_from_admin ? "Support Team" : "You",
      is_original: false,
      email_source: reply.email_source || false,
    })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  console.log("[v0] All messages to display:", allMessages.length)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-2">
            <MessageCircle className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900">Support Conversation</h1>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{message.subject}</h2>
              <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                <span className="font-mono text-blue-600">{message.ticket_number}</span>
                <span>•</span>
                <span>{message.name}</span>
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(message.status)} className="capitalize">
              {message.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border min-h-[600px] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {allMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.is_from_admin ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-start space-x-3 max-w-[70%] ${msg.is_from_admin ? "flex-row-reverse space-x-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      msg.is_from_admin ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                    }`}
                  >
                    {msg.is_from_admin ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.is_from_admin
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md"
                      }`}
                    >
                      {msg.is_original && (
                        <div
                          className={`text-xs mb-2 font-medium ${
                            msg.is_from_admin ? "text-blue-100" : "text-gray-600"
                          }`}
                        >
                          Original Message
                        </div>
                      )}
                      {msg.email_source && !msg.is_original && (
                        <div
                          className={`text-xs mb-2 font-medium flex items-center space-x-1 ${
                            msg.is_from_admin ? "text-blue-100" : "text-blue-600"
                          }`}
                        >
                          <AtSign className="h-3 w-3" />
                          <span>Sent via email</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Message Info */}
                    <div
                      className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${
                        msg.is_from_admin ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="font-medium">{msg.sender_name}</span>
                      <span>•</span>
                      <span>{format(new Date(msg.created_at), "MMM d, h:mm a")}</span>
                      {msg.email_source && (
                        <>
                          <span>•</span>
                          <AtSign className="h-3 w-3" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t p-6">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitReply()
                    }
                  }}
                />
                <div className="text-xs text-gray-500 mt-1">Press Enter to send, Shift+Enter for new line</div>
              </div>
              <Button
                onClick={handleSubmitReply}
                disabled={isSubmitting || !replyContent.trim()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
