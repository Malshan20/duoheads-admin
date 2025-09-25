"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const chartConfig = {
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
  users: {
    label: "Users",
    color: "hsl(var(--chart-3))",
  },
}

export function AnalyticsCharts() {
  const [orderData, setOrderData] = useState<any[]>([])
  const [userGrowthData, setUserGrowthData] = useState<any[]>([])

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      const supabase = createClient()

      // Fetch orders data for the last 7 days
      const { data: orders } = await supabase
        .from("orders")
        .select("created_at, amount, status")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      // Fetch user registration data for the last 7 days
      const { data: users } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      // Process orders data by day
      const ordersByDay = orders?.reduce((acc: any, order) => {
        const date = new Date(order.created_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = { date, orders: 0, revenue: 0 }
        }
        acc[date].orders += 1
        if (order.status === "paid") {
          acc[date].revenue += order.amount || 0
        }
        return acc
      }, {})

      // Process users data by day
      const usersByDay = users?.reduce((acc: any, user) => {
        const date = new Date(user.created_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = { date, users: 0 }
        }
        acc[date].users += 1
        return acc
      }, {})

      setOrderData(Object.values(ordersByDay || {}))
      setUserGrowthData(Object.values(usersByDay || {}))
    }

    fetchAnalyticsData()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orders & Revenue</CardTitle>
          <CardDescription>Daily orders and revenue for the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <BarChart data={orderData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-orders)" />
                <Bar dataKey="revenue" fill="var(--color-revenue)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <LineChart data={userGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="users" stroke="#000" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
