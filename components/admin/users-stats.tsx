import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { Users, UserCheck, UserX, Crown } from "lucide-react"

export async function UsersStats() {
  const supabase = await createClient()

  // Fetch user statistics
  const [{ count: totalUsers }, { data: activeUsers }, { data: premiumUsers }, { data: recentUsers }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*").eq("subscription_status", "active"),
      supabase.from("profiles").select("*").in("subscription_tier", ["Forest Guardian", "Jungle Master"]),
      supabase
        .from("profiles")
        .select("*")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

  const stats = [
    {
      title: "Total Users",
      value: totalUsers || 0,
      icon: Users,
      description: "All registered users",
      color: "text-blue-600",
    },
    {
      title: "Active Users",
      value: activeUsers?.length || 0,
      icon: UserCheck,
      description: "Users with active subscriptions",
      color: "text-green-600",
    },
    {
      title: "Premium Users",
      value: premiumUsers?.length || 0,
      icon: Crown,
      description: "Forest Guardian & Jungle Master subscribers",
      color: "text-purple-600",
    },
    {
      title: "New This Month",
      value: recentUsers?.length || 0,
      icon: UserX,
      description: "Users joined in last 30 days",
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
