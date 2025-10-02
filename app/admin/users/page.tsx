import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsersTable } from "@/components/admin/users-table"
import { UsersStats } from "@/components/admin/users-stats"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
      </div>

      <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
        <UsersStats />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
        <UsersTable />
      </Suspense>
    </div>
  )
}
