import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentActivity } from "@/components/admin/recent-activity"
import { AnalyticsCharts } from "@/components/admin/analytics-charts"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome to Duoheads Admin Panel</h2>
      </div>

      <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <Suspense fallback={<div className="h-80 bg-muted animate-pulse rounded-lg" />}>
            <AnalyticsCharts />
          </Suspense>
        </div>
        <div className="col-span-3">
          <Suspense fallback={<div className="h-80 bg-muted animate-pulse rounded-lg" />}>
            <RecentActivity />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
