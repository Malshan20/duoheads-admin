import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminStats } from "@/lib/supabase/admin-management"
import { Shield, UserCheck, Crown, Clock } from "lucide-react"

export async function AdminStats() {
  const stats = await getAdminStats()

  const statCards = [
    {
      title: "Total Admins",
      value: stats.totalAdmins,
      icon: Shield,
      description: "All admin users",
      color: "text-blue-600",
    },
    {
      title: "Super Admins",
      value: stats.superAdmins,
      icon: Crown,
      description: "Users with super admin role",
      color: "text-red-600",
    },
    {
      title: "Regular Admins",
      value: stats.regularAdmins,
      icon: UserCheck,
      description: "Users with admin role",
      color: "text-green-600",
    },
    {
      title: "Recent Admins",
      value: stats.recentAdmins,
      icon: Clock,
      description: "Added in last 30 days",
      color: "text-purple-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
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
