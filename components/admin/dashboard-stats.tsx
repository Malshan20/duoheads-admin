import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { getStripeRevenue } from "@/lib/stripe/revenue"
import { Users, ShoppingCart, DollarSign, BookOpen } from "lucide-react"

export async function DashboardStats() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalOrders },
    { data: paidOrders },
    { count: tutorSessions },
    { count: voiceUsage },
    { count: stressReliefChats },
    stripeRevenue,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("amount").eq("status", "paid"),
    supabase.from("tutor_sessions").select("*", { count: "exact", head: true }),
    supabase.from("daily_voice_tutor_usage").select("*", { count: "exact", head: true }),
    supabase.from("stress_relief_chats").select("*", { count: "exact", head: true }),
    getStripeRevenue(),
  ])

  const totalRevenue = stripeRevenue.total || paidOrders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0

  const stats = [
    {
      title: "Total Users",
      value: totalUsers || 0,
      icon: Users,
      description: "Registered users",
      color: "text-blue-600",
    },
    {
      title: "Active Subscriptions",
      value: totalUsers || 0,
      icon: Users,
      description: "Active subscribers",
      color: "text-green-600",
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "From Stripe payments",
      color: "text-emerald-600",
    },
    {
      title: "Monthly Revenue",
      value: `$${stripeRevenue.monthly.toLocaleString()}`,
      icon: DollarSign,
      description: "This month",
      color: "text-green-600",
    },
    {
      title: "Total Orders",
      value: totalOrders || 0,
      icon: ShoppingCart,
      description: "All time orders",
      color: "text-orange-600",
    },
    {
      title: "Tutor Sessions",
      value: tutorSessions || 0,
      icon: BookOpen,
      description: "Sessions started",
      color: "text-purple-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
