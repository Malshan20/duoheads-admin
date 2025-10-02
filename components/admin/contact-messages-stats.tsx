import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { Mail, MailOpen, Clock, CheckCircle } from "lucide-react"

export async function ContactMessagesStats() {
  const supabase = await createClient()

  // Fetch contact message statistics
  const [{ count: totalMessages }, { data: unreadMessages }, { data: readMessages }, { data: recentMessages }] =
    await Promise.all([
      supabase.from("contact_messages").select("*", { count: "exact", head: true }),
      supabase.from("contact_messages").select("*").eq("status", "unread"),
      supabase.from("contact_messages").select("*").eq("status", "read"),
      supabase
        .from("contact_messages")
        .select("*")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ])

  const stats = [
    {
      title: "Total Messages",
      value: totalMessages || 0,
      icon: Mail,
      description: "All contact messages",
      color: "text-blue-600",
    },
    {
      title: "Unread Messages",
      value: unreadMessages?.length || 0,
      icon: MailOpen,
      description: "Require attention",
      color: "text-red-600",
    },
    {
      title: "Read Messages",
      value: readMessages?.length || 0,
      icon: CheckCircle,
      description: "Already reviewed",
      color: "text-green-600",
    },
    {
      title: "Today's Messages",
      value: recentMessages?.length || 0,
      icon: Clock,
      description: "Received in last 24h",
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
