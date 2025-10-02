"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"
import { getStripePayments } from "@/lib/stripe/revenue"
import { AlertCircle } from "lucide-react"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
}

export function RevenueAnalytics() {
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stripeConfigured, setStripeConfigured] = useState(true)

  useEffect(() => {
    const fetchRevenueData = async () => {
      console.log("[v0] Starting to fetch revenue data...")

      try {
        console.log("[v0] Fetching Stripe payments...")
        const payments = await getStripePayments()
        console.log("[v0] Received payments:", payments.length)

        setStripeConfigured(true)

        // Group payments by day for the last 30 days
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (29 - i))
          return date.toISOString().split("T")[0]
        })

        const revenueByDay = last30Days.map((date) => {
          const dayPayments = payments.filter((payment) => {
            const paymentDate = new Date(payment.created * 1000).toISOString().split("T")[0]
            return paymentDate === date && payment.status === "succeeded"
          })

          const revenue = dayPayments.reduce((sum, payment) => sum + payment.amount, 0)

          return {
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
          }
        })

        console.log("[v0] Processed revenue data:", revenueByDay)
        setRevenueData(revenueByDay)
        setError(null)
      } catch (error) {
        console.error("[v0] Error fetching revenue data:", error)
        if (error instanceof Error && error.message.includes("not configured")) {
          setStripeConfigured(false)
        }
        setError(error instanceof Error ? error.message : "Failed to fetch revenue data")
        setRevenueData([])
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Loading revenue data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>
          {stripeConfigured ? "Daily revenue over the last 30 days" : "Stripe not configured"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!stripeConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure Stripe to see revenue analytics. No data available without Stripe integration.
            </AlertDescription>
          </Alert>
        )}

        {error && stripeConfigured && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error loading revenue data: {error}</AlertDescription>
          </Alert>
        )}

        {stripeConfigured && !error && revenueData.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No revenue data found for the last 30 days.</AlertDescription>
          </Alert>
        )}

        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={350}>
            <AreaChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `$${value}`} domain={[0, "dataMax"]} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => [`$${value}`, "Revenue"]} />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                fill="var(--color-revenue)"
                fillOpacity={0.3}
                className="stroke-blue-500 fill-blue-500 dark:stroke-white dark:fill-white"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
