"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ContactMessage } from "@/lib/supabase/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MoreHorizontal,
  Search,
  Eye,
  MailOpen,
  Archive,
  ArchiveRestore,
  User,
  Calendar,
  MessageSquare,
  Reply,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { useRouter } from "next/navigation"

export function ContactMessagesTable() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()

  useEffect(() => {
    fetchMessages()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel("contact_messages_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, (payload) => {
        console.log("[v0] Real-time update received:", payload)
        fetchMessages()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchMessages = async () => {
    const supabase = createClient()
    console.log("[v0] Fetching messages ordered by updated_at desc")
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching messages:", error)
    } else {
      console.log("[v0] Fetched messages count:", data?.length)
      if (data && data.length > 0) {
        console.log("[v0] First message updated_at:", data[0].updated_at)
        console.log("[v0] Last message updated_at:", data[data.length - 1].updated_at)
      }
      setMessages(data || [])
    }
    setLoading(false)
  }

  const updateMessageStatus = async (messageId: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", messageId)

    if (error) {
      console.error("Error updating message:", error)
    } else {
      fetchMessages()
    }
  }

  const markAsRead = async (message: ContactMessage) => {
    const supabase = createClient()
    const updates: { has_unread_replies?: boolean; status?: string } = {}

    if (message.has_unread_replies) {
      updates.has_unread_replies = false
    }

    if (message.status === "unread") {
      updates.status = "read"
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("contact_messages").update(updates).eq("id", message.id)
      await fetchMessages()
    }

    setSelectedMessage(message)
    setIsViewDialogOpen(true)
  }

  const unarchiveMessage = async (messageId: string) => {
    await updateMessageStatus(messageId, "read")
  }

  const navigateToReply = (message: ContactMessage) => {
    router.push(`/admin/contact-messages/${message.id}/reply`)
  }

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || message.status === statusFilter

    return matchesSearch && matchesStatus
  })

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

  const getPriorityLevel = (createdAt: string) => {
    const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    if (hoursOld > 48) return "high"
    if (hoursOld > 24) return "medium"
    return "low"
  }

  if (loading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Contact Messages</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Manage customer inquiries and support requests
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredMessages.length} of {messages.length} messages
          </div>
        </div>
        <div className="flex items-center space-x-3 pt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, subject, or ticket number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="font-semibold text-foreground pl-6">Ticket #</TableHead>
              <TableHead className="font-semibold text-foreground">Contact</TableHead>
              <TableHead className="font-semibold text-foreground">Subject & Preview</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground">Date</TableHead>
              <TableHead className="text-right font-semibold text-foreground pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMessages.map((message) => {
              const priority = getPriorityLevel(message.created_at)
              return (
                <TableRow
                  key={message.id}
                  className={`
                    hover:bg-muted/50 transition-colors cursor-pointer
                    ${message.status === "unread" ? "bg-blue-50/30 border-l-2 border-l-blue-500" : ""}
                    ${priority === "high" ? "border-l-2 border-l-red-400" : ""}
                  `}
                  onClick={() => markAsRead(message)}
                >
                  <TableCell className="pl-6 py-4">
                    <div className="font-mono text-sm font-medium text-blue-600">{message.ticket_number}</div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">{message.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{message.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground line-clamp-1">{message.subject}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2 max-w-[400px]">{message.message}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadgeVariant(message.status)} className="capitalize">
                        {message.status}
                      </Badge>
                      {message.has_unread_replies && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                          New Reply
                        </Badge>
                      )}
                      {priority === "high" && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <div className="text-foreground">
                          {formatDistanceToNow(new Date(message.updated_at), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(message.updated_at), "MMM d, h:mm a")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(message)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View message
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            navigateToReply(message)
                          }}
                        >
                          <Reply className="mr-2 h-4 w-4" />
                          Reply
                        </DropdownMenuItem>
                        {message.status === "unread" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              updateMessageStatus(message.id, "read")
                            }}
                          >
                            <MailOpen className="mr-2 h-4 w-4" />
                            Mark as read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {message.status !== "archived" ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              updateMessageStatus(message.id, "archived")
                            }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              unarchiveMessage(message.id)
                            }}
                          >
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Unarchive
                          </DropdownMenuItem>
                        )}
                        {message.status !== "closed" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              updateMessageStatus(message.id, "closed")
                            }}
                          >
                            Close
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-xl font-semibold leading-tight">{selectedMessage?.subject}</DialogTitle>
                  <DialogDescription className="text-base">
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-muted-foreground">TICKET:</span>
                        <span className="font-mono text-sm font-medium text-blue-600">
                          {selectedMessage?.ticket_number}
                        </span>
                      </div>
                      <div className="text-muted-foreground">•</div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{selectedMessage?.name}</span>
                      </div>
                      <div className="text-muted-foreground">•</div>
                      <span>{selectedMessage?.email}</span>
                    </div>
                  </DialogDescription>
                </div>
                {selectedMessage && (
                  <Badge variant={getStatusBadgeVariant(selectedMessage.status)} className="capitalize">
                    {selectedMessage.status}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {selectedMessage && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>Message Content</span>
                  </div>
                  <div className="bg-muted/50 p-6 rounded-lg border">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Received {formatDistanceToNow(new Date(selectedMessage.created_at), { addSuffix: true })}
                      on {format(new Date(selectedMessage.created_at), "MMMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex items-center justify-between pt-6">
              <div className="flex space-x-2">
                <Button
                  variant="default"
                  onClick={() => {
                    if (selectedMessage) {
                      setIsViewDialogOpen(false)
                      navigateToReply(selectedMessage)
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Reply className="h-4 w-4" />
                  <span>Reply</span>
                </Button>
                {selectedMessage?.status !== "archived" ? (
                  <Button
                    variant="outline"
                    onClick={() => selectedMessage && updateMessageStatus(selectedMessage.id, "archived")}
                    className="flex items-center space-x-2"
                  >
                    <Archive className="h-4 w-4" />
                    <span>Archive</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => selectedMessage && unarchiveMessage(selectedMessage.id)}
                    className="flex items-center space-x-2"
                  >
                    <ArchiveRestore className="h-4 w-4" />
                    <span>Unarchive</span>
                  </Button>
                )}
                {selectedMessage?.status !== "closed" && (
                  <Button
                    variant="outline"
                    onClick={() => selectedMessage && updateMessageStatus(selectedMessage.id, "closed")}
                    className="flex items-center space-x-2"
                  >
                    Close
                  </Button>
                )}
              </div>
              <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {filteredMessages.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No messages found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Contact messages will appear here when customers reach out."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
