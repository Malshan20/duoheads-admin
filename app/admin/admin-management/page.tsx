import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminManagementTable } from "@/components/admin/admin-management-table"
import { AdminStats } from "@/components/admin/admin-stats"

export default async function AdminManagementPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: adminCheck } = await supabase.from("admins").select("role").eq("user_id", data.user.id).single()

  if (!adminCheck) {
    redirect("/admin") // Redirect to main admin page if not an admin
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Management</h2>
      </div>

      <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
        <AdminStats />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
        <AdminManagementTable />
      </Suspense>
    </div>
  )
}
