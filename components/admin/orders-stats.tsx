import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { ShoppingCart, DollarSign, TrendingUp, Package } from "lucide-react"

export async function OrdersStats() {
  const supabase = await createClient()

  // Fetch order statistics
  const [{ count: totalOrders }, { data: paidOrders }, { data: pendingOrders }, { data: recentOrders }] =
    await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("amount").eq("status", "paid"),
      supabase.from("orders").select("*").eq("status", "pending"),
      supabase
        .from("orders")
        .select("*")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

  const totalRevenue = paidOrders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0
  const averageOrderValue = paidOrders?.length ? totalRevenue / paidOrders.length : 0

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders || 0,
      icon: ShoppingCart,
      description: "All time orders",
      color: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "From paid orders",
      color: "text-green-600",
    },
    {
      title: "Pending Orders",
      value: pendingOrders?.length || 0,
      icon: Package,
      description: "Awaiting processing",
      color: "text-orange-600",
    },
    {
      title: "Avg Order Value",
      value: `$${averageOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      description: "Average per order",
      color: "text-purple-600",
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
