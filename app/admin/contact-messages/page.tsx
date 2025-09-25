import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ContactMessagesTable } from "@/components/admin/contact-messages-table"
import { ContactMessagesStats } from "@/components/admin/contact-messages-stats"

export default async function ContactMessagesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Contact Messages</h2>
          <p className="text-muted-foreground mt-1">Manage and respond to customer inquiries and support requests</p>
        </div>
      </div>

      <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
        <ContactMessagesStats />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
        <ContactMessagesTable />
      </Suspense>
    </div>
  )
}
