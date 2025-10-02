"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ContactMessage, MessageReply } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { User, Send, Copy, ArrowLeft, Shield, Mail, MailCheck, AtSign, XCircle, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
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

interface MessageReplyFormProps {
  message: ContactMessage
  existingReplies: MessageReply[]
}

export function MessageReplyForm({ message, existingReplies }: MessageReplyFormProps) {
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isEndingChat, setIsEndingChat] = useState(false)
  const [chatStatus, setChatStatus] = useState(message.status)
  const [replies, setReplies] = useState<MessageReply[]>(existingReplies)
  const [sendEmailNotification, setSendEmailNotification] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    console.log("[v0] MessageReplyForm mounted with replies:", existingReplies)
    setReplies(existingReplies)
    setChatStatus(message.status)
  }, [existingReplies, message.status])

  const refreshReplies = async () => {
    console.log("[v0] Refreshing replies for message:", message.id)
    const supabase = createClient()

    const { data: newReplies, error } = await supabase
      .from("message_replies")
      .select("*")
      .eq("contact_message_id", message.id)
      .order("created_at", { ascending: true })

    console.log("[v0] Refreshed replies:", { newReplies, error })

    if (error) {
      console.error("[v0] Error refreshing replies:", error)
    } else {
      setReplies(newReplies || [])
    }
  }

  const sendEmailNotificationToCustomer = async (replyText: string) => {
    try {
      console.log("[v0] Sending email notification to customer")
      setIsSendingEmail(true)

      const response = await fetch("/api/email/send-reply-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: message.id,
          adminReply: replyText,
        }),
      })

      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        // Handle non-JSON responses (like HTML error pages)
        const text = await response.text()
        result = { error: `Server error: ${response.status} ${response.statusText}` }
        console.error("[v0] Non-JSON response:", text)
      }

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      console.log("[v0] Email notification sent successfully:", result)

      toast({
        title: "Email sent",
        description: "Customer has been notified via email.",
      })

      return true
    } catch (error) {
      console.error("[v0] Failed to send email notification:", error)
      toast({
        title: "Email failed",
        description: "Reply saved but email notification failed to send.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()

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

    try {
      const { data: userData } = await supabase.auth.getUser()

      console.log("[v0] Submitting reply for message:", message.id)

      const { error: replyError } = await supabase.from("message_replies").insert({
        contact_message_id: message.id,
        admin_id: userData.user?.id,
        reply_content: replyContent.trim(),
        is_from_admin: true,
      })

      if (replyError) {
        console.error("[v0] Error inserting reply:", replyError)
        throw replyError
      }

      console.log("[v0] Reply inserted successfully")

      if (message.status === "unread") {
        const { error: statusError } = await supabase
          .from("contact_messages")
          .update({ status: "read" })
          .eq("id", message.id)

        if (statusError) {
          console.error("[v0] Error updating status:", statusError)
        }
      }

      if (sendEmailNotification) {
        await sendEmailNotificationToCustomer(replyContent.trim())
      }

      toast({
        title: "Reply sent",
        description: sendEmailNotification
          ? "Your reply has been sent and customer notified via email."
          : "Your reply has been sent successfully.",
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

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reply/${message.reply_token}`)
      toast({
        title: "URL copied",
        description: "Public reply URL copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleEndChat = async () => {
    setIsEndingChat(true)

    try {
      const response = await fetch("/api/contact-messages/end-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: message.id,
          endedBy: "admin",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to end chat")
      }

      setChatStatus("closed")

      toast({
        title: "Chat ended",
        description: result.emailSent
          ? "Chat has been closed and customer notified via email."
          : "Chat has been closed.",
      })

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh()
      }, 1500)
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
      sender_name: message.name,
      is_original: true,
      email_source: false,
    },
    ...replies.map((reply) => ({
      id: reply.id,
      content: reply.reply_content,
      is_from_admin: reply.is_from_admin,
      created_at: reply.created_at,
      sender_name: reply.is_from_admin ? "Admin" : message.name,
      is_original: false,
      email_source: reply.email_source || false,
    })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  console.log("[v0] All messages to display:", allMessages)

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="bg-card border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{message.subject}</h1>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <span className="font-mono text-primary">{message.ticket_number}</span>
              <span>•</span>
              <span>{message.name}</span>
              <span>•</span>
              <span>{message.email}</span>
            </div>
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
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                  <XCircle className="h-4 w-4 mr-2" />
                  End Chat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End this chat?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the conversation as resolved and send a feedback request email to the customer. The
                    customer will no longer be able to reply to this conversation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEndChat}
                    disabled={isEndingChat}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isEndingChat ? "Ending..." : "End Chat"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {chatStatus === "closed" && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-3">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm font-medium">
              This chat has been closed. Customer has been notified and can no longer reply.
            </p>
          </div>
        </div>
      )}

      <div className="px-6 py-4 bg-primary/5 border-b">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Share with customer</p>
            <p className="text-xs text-primary/70">Customer can reply using this URL</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs font-mono bg-card px-2 py-1 rounded border max-w-xs truncate text-foreground">
              {`${window.location.origin}/reply/${message.reply_token}`}
            </div>
            <Button variant="outline" size="sm" onClick={copyPublicUrl}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-6 py-4 space-y-4">
          {allMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.is_from_admin ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start space-x-2 max-w-[70%] ${msg.is_from_admin ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    msg.is_from_admin ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {msg.is_from_admin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                <div className="flex flex-col">
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.is_from_admin
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border rounded-bl-md shadow-sm text-card-foreground"
                    }`}
                  >
                    {msg.is_original && <div className="text-xs opacity-75 mb-2 font-medium">Original Message</div>}
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
      </div>

      <div className="bg-card border-t px-6 py-4">
        {chatStatus === "closed" ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">This conversation has been closed and no longer accepts replies.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSendEmailNotification(!sendEmailNotification)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    sendEmailNotification
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {sendEmailNotification ? <MailCheck className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                  <span>Email notification</span>
                </button>
              </div>
              {isSendingEmail && (
                <div className="text-xs text-primary flex items-center space-x-1">
                  <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
                  <span>Sending email...</span>
                </div>
              )}
            </div>

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
                      handleSubmitReply(e)
                    }
                  }}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Press Enter to send, Shift+Enter for new line
                  {sendEmailNotification && " • Customer will be notified via email"}
                </div>
              </div>
              <Button
                onClick={(e) => handleSubmitReply(e)}
                disabled={isSubmitting || isSendingEmail || !replyContent.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
