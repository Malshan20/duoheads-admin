import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface Setting {
  key: string
  value: any
  category: string
  description?: string
}

export async function getSettingsByCategory(category: string): Promise<Setting[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("settings").select("key, value, description").eq("category", category)

  if (error) {
    console.error("Error fetching settings:", error)
    throw error
  }

  return data.map((item) => ({
    key: item.key,
    value: typeof item.value === "string" ? JSON.parse(item.value) : item.value,
    category,
    description: item.description,
  }))
}

export async function getAllSettings(): Promise<Setting[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("settings").select("key, value, category, description")

  if (error) {
    console.error("Error fetching all settings:", error)
    throw error
  }

  return data.map((item) => ({
    key: item.key,
    value: typeof item.value === "string" ? JSON.parse(item.value) : item.value,
    category: item.category,
    description: item.description,
  }))
}

export async function updateSetting(key: string, value: any): Promise<void> {
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from("settings")
    .update({
      value: JSON.stringify(value),
      updated_at: new Date().toISOString(),
    })
    .eq("key", key)

  if (error) {
    console.error("Error updating setting:", error)
    throw error
  }
}

export async function updateMultipleSettings(settings: Record<string, any>): Promise<void> {
  const adminClient = createAdminClient()

  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value: JSON.stringify(value),
    updated_at: new Date().toISOString(),
  }))

  for (const update of updates) {
    const { error } = await adminClient
      .from("settings")
      .update({
        value: update.value,
        updated_at: update.updated_at,
      })
      .eq("key", update.key)

    if (error) {
      console.error(`Error updating setting ${update.key}:`, error)
      throw error
    }
  }
}
