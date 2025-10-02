"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const chartConfig = {
  users: {
    label: "New Users",
    color: "hsl(var(--chart-2))",
  },
  total: {
    label: "Total Users",
    color: "hsl(var(--chart-3))",
  },
}

export function UserAnalytics() {
  const [userData, setUserData] = useState<any[]>([])

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()

      try {
        // Fetch all users
        const { data: users } = await supabase
          .from("profiles")
          .select("created_at")
          .order("created_at", { ascending: true })

        if (!users) return

        // Group users by day for the last 30 days
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (29 - i))
          return date.toISOString().split("T")[0]
        })

        let totalUsers = 0
        const usersByDay = last30Days.map((date) => {
          const dayUsers = users.filter((user) => {
            const userDate = new Date(user.created_at).toISOString().split("T")[0]
            return userDate === date
          })

          totalUsers += dayUsers.length

          return {
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            users: dayUsers.length,
            total: totalUsers,
          }
        })

        setUserData(usersByDay)
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>New user registrations and total users over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={350}>
            <LineChart data={userData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="var(--color-users)"
                strokeWidth={2}
                name="New Users"
                dot={false}
                className="stroke-indigo-500 dark:stroke-white"
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                strokeWidth={2}
                name="Total Users"
                dot={false}
                className="stroke-purple-500 dark:stroke-slate-200"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
