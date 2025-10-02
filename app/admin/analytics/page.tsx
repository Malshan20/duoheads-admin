import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StripeRevenueStats } from "@/components/admin/stripe-revenue-stats"
import { AnalyticsCharts } from "@/components/admin/analytics-charts"
import { UserAnalytics } from "@/components/admin/user-analytics"
import { RevenueAnalytics } from "@/components/admin/revenue-analytics"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
      </div>

      <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
        <StripeRevenueStats />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<div className="h-[400px] bg-muted animate-pulse rounded-lg" />}>
          <RevenueAnalytics />
        </Suspense>
       
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="h-[400px] bg-muted animate-pulse rounded-lg" />}>
            <AnalyticsCharts />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
