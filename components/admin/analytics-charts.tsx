"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

// Helper to get array of last N days (excluding today), formatted as "YYYY-MM-DD"
function getLastNDates(n: number) {
  const dates: string[] = []
  const today = new Date()
  for (let i = n; i >= 1; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    // Format as YYYY-MM-DD for easier matching
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    dates.push(`${yyyy}-${mm}-${dd}`)
  }
  return dates
}

// Helper to format date for chart X axis (e.g., "Apr 10")
function formatChartDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

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
      const last7Dates = getLastNDates(7) // 7 days, ending with yesterday

      // Fetch orders data for the last 7 days (excluding today)
      const { data: orders } = await supabase
        .from("orders")
        .select("created_at, amount, status")
        .gte("created_at", last7Dates[0] + "T00:00:00.000Z")
        .lt("created_at", new Date().toISOString()) // up to now

      // Fetch user registration data for the last 7 days (excluding today)
      const { data: users } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", last7Dates[0] + "T00:00:00.000Z")
        .lt("created_at", new Date().toISOString())

      // Prepare a map for orders and revenue per day
      const ordersMap: Record<string, { date: string; orders: number; revenue: number }> = {}
      last7Dates.forEach((date) => {
        ordersMap[date] = {
          date: formatChartDate(date),
          orders: 0,
          revenue: 0,
        }
      })

      // Fill in orders and revenue
      orders?.forEach((order) => {
        const d = new Date(order.created_at)
        // Format as YYYY-MM-DD
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, "0")
        const dd = String(d.getDate()).padStart(2, "0")
        const dateKey = `${yyyy}-${mm}-${dd}`
        if (ordersMap[dateKey]) {
          ordersMap[dateKey].orders += 1
          if (order.status === "paid") {
            ordersMap[dateKey].revenue += order.amount || 0
          }
        }
      })

      // Prepare a map for users per day
      const usersMap: Record<string, { date: string; users: number }> = {}
      last7Dates.forEach((date) => {
        usersMap[date] = {
          date: formatChartDate(date),
          users: 0,
        }
      })

      users?.forEach((user) => {
        const d = new Date(user.created_at)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, "0")
        const dd = String(d.getDate()).padStart(2, "0")
        const dateKey = `${yyyy}-${mm}-${dd}`
        if (usersMap[dateKey]) {
          usersMap[dateKey].users += 1
        }
      })

      setOrderData(Object.values(ordersMap))
      setUserGrowthData(Object.values(usersMap))
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
                <Bar dataKey="orders" fill="var(--color-orders)" className="fill-blue-500 dark:fill-white" />
                <Bar dataKey="revenue" fill="var(--color-revenue)" className="fill-indigo-500 dark:fill-slate-200" />
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
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="var(--color-users)"
                  strokeWidth={2}
                  dot={false}
                  className="stroke-purple-500 dark:stroke-white"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
