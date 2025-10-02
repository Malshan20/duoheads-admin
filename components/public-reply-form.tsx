"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ContactMessage, MessageReply } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { User, Send, Shield, MessageCircle, AtSign, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PublicReplyFormProps {
  message: ContactMessage
  existingReplies: MessageReply[]
}

export function PublicReplyForm({ message, existingReplies }: PublicReplyFormProps) {
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEndingChat, setIsEndingChat] = useState(false)
  const [chatStatus, setChatStatus] = useState(message.status)
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
    setChatStatus(message.status)
  }, [message.id, message.status])

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message.",
        variant: "destructive",
      })
      return
    }

    if (chatStatus === "closed") {
      toast({
        title: "Chat closed",
        description: "This conversation has been closed and no longer accepts replies.",
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
          admin_id: null,
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
        description: error instanceof Error ? error.message : "Failed to send reply",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEndChat = async () => {
    setIsEndingChat(true)
    const supabase = createClient()

    try {
      // Update the message status to closed
      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({ status: "closed" })
        .eq("id", message.id)

      if (updateError) throw updateError

      // Call the API to send feedback email
      const response = await fetch("/api/contact-messages/end-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: message.id,
          endedBy: "customer",
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to end chat")
      }

      setChatStatus("closed")

      toast({
        title: "Chat ended",
        description: "Thank you! We've closed this conversation. You'll receive a feedback request via email.",
      })
    } catch (error) {
      console.error("[v0] Error ending chat:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end chat",
        variant: "destructive",
      })
    } finally {
      setIsEndingChat(false)
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
      case "closed":
        return "outline"
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Support Conversation</h1>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{message.subject}</h2>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground mt-1">
                <span className="font-mono text-primary">{message.ticket_number}</span>
                <span>•</span>
                <span>{message.name}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusBadgeVariant(chatStatus)} className="capitalize flex items-center space-x-1">
                {chatStatus === "closed" && <CheckCircle className="h-3 w-3" />}
                <span>{chatStatus}</span>
              </Badge>
              {chatStatus !== "closed" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 bg-transparent">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mark this conversation as resolved?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will close the conversation and you'll receive a feedback request via email. You won't be
                        able to send more replies after this.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleEndChat}
                        disabled={isEndingChat}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isEndingChat ? "Closing..." : "Mark as Resolved"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {chatStatus === "closed" && (
        <div className="bg-green-500/10 border-b border-green-500/20">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <p className="text-sm font-medium">
                This conversation has been marked as resolved. Thank you for contacting support!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-card rounded-lg shadow-sm border min-h-[600px] flex flex-col">
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
                      msg.is_from_admin ? "bg-primary text-primary-foreground" : "bg-green-500 text-white"
                    }`}
                  >
                    {msg.is_from_admin ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.is_from_admin
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.is_original && (
                        <div
                          className={`text-xs mb-2 font-medium ${
                            msg.is_from_admin ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          Original Message
                        </div>
                      )}
                      {msg.email_source && !msg.is_original && (
                        <div
                          className={`text-xs mb-2 font-medium flex items-center space-x-1 ${
                            msg.is_from_admin ? "text-primary-foreground/70" : "text-primary"
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
                      className={`flex items-center space-x-2 mt-1 text-xs text-muted-foreground ${
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
            {chatStatus === "closed" ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">This conversation has been closed. Thank you for contacting support!</p>
              </div>
            ) : (
              <>
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmitReply()
                        }
                      }}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Press Enter to send, Shift+Enter for new line
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmitReply}
                    disabled={isSubmitting || !replyContent.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
