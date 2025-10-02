import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { formatDistanceToNow } from "date-fns"

export async function RecentActivity() {
  const supabase = await createClient()

  // Fetch recent activities from different tables
  const [{ data: recentOrders }, { data: recentMessages }, { data: recentSessions }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(3),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(3),
    supabase.from("tutor_sessions").select("*").order("created_at", { ascending: false }).limit(2),
  ])

  const activities = [
    ...(recentOrders?.map((order) => ({
      type: "order",
      title: `New order from ${order.customer_name}`,
      description: `${order.product_name} - $${order.amount}`,
      time: order.created_at,
      status: order.status,
    })) || []),
    ...(recentMessages?.map((message) => ({
      type: "message",
      title: `New message from ${message.name}`,
      description: message.subject,
      time: message.created_at,
      status: message.status,
    })) || []),
    ...(recentSessions?.map((session) => ({
      type: "session",
      title: `New tutor session`,
      description: `${session.subject}${session.topic ? ` - ${session.topic}` : ""}`,
      time: session.created_at,
      status: "active",
    })) || []),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "unread":
        return "bg-blue-100 text-blue-800"
      case "read":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                </p>
              </div>
              <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
