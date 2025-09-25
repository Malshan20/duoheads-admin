import { stripe, isStripeConfigured } from "./client"
import type { StripeRevenue, StripeSubscription, StripePayment } from "./types"

export async function getStripeRevenue(): Promise<StripeRevenue> {
  console.log("[v0] Starting to fetch revenue data...")
  console.log("[v0] Stripe configured:", isStripeConfigured)
  console.log("[v0] Stripe client exists:", !!stripe)

  if (!isStripeConfigured || !stripe) {
    console.log("[v0] Stripe not configured, returning zero values")
    return {
      total: 0,
      monthly: 0,
      daily: 0,
      subscriptions: 0,
      oneTime: 0,
    }
  }

  try {
    console.log("[v0] Fetching Stripe data...")
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Get all charges for revenue calculation
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(startOfMonth.getTime() / 1000),
      },
      limit: 100,
    })

    console.log("[v0] Found charges:", charges.data.length)

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    })

    console.log("[v0] Found subscriptions:", subscriptions.data.length)

    // Calculate totals
    const monthlyCharges = charges.data.filter(
      (charge) => charge.created >= Math.floor(startOfMonth.getTime() / 1000) && charge.paid,
    )

    const dailyCharges = charges.data.filter(
      (charge) => charge.created >= Math.floor(startOfDay.getTime() / 1000) && charge.paid,
    )

    const subscriptionRevenue =
      subscriptions.data.reduce((sum, sub) => {
        return sum + (sub.items.data[0]?.price?.unit_amount || 0)
      }, 0) / 100

    const oneTimeRevenue =
      monthlyCharges.filter((charge) => !charge.invoice).reduce((sum, charge) => sum + charge.amount, 0) / 100

    const result = {
      total: charges.data.reduce((sum, charge) => sum + (charge.paid ? charge.amount : 0), 0) / 100,
      monthly: monthlyCharges.reduce((sum, charge) => sum + charge.amount, 0) / 100,
      daily: dailyCharges.reduce((sum, charge) => sum + charge.amount, 0) / 100,
      subscriptions: subscriptionRevenue,
      oneTime: oneTimeRevenue,
    }

    console.log("[v0] Revenue data:", result)
    return result
  } catch (error) {
    console.error("[v0] Error fetching Stripe revenue:", error)
    return {
      total: 0,
      monthly: 0,
      daily: 0,
      subscriptions: 0,
      oneTime: 0,
    }
  }
}

export async function getStripeSubscriptions(): Promise<StripeSubscription[]> {
  if (!isStripeConfigured || !stripe) {
    return []
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ["data.customer", "data.items.data.price.product"],
    })

    return subscriptions.data.map((sub) => ({
      id: sub.id,
      customer: typeof sub.customer === "string" ? sub.customer : sub.customer?.email || "Unknown",
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
      currency: sub.items.data[0]?.price?.currency || "usd",
      product_name:
        typeof sub.items.data[0]?.price?.product === "string"
          ? "Product"
          : (sub.items.data[0]?.price?.product as any)?.name || "Unknown Product",
    }))
  } catch (error) {
    console.error("Error fetching Stripe subscriptions:", error)
    return []
  }
}

export async function getStripePayments(): Promise<StripePayment[]> {
  if (!isStripeConfigured || !stripe) {
    return []
  }

  try {
    const charges = await stripe.charges.list({
      limit: 50,
      expand: ["data.customer"],
    })

    return charges.data.map((charge) => ({
      id: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency,
      status: charge.status,
      created: charge.created,
      customer: typeof charge.customer === "string" ? charge.customer : charge.customer?.email || "Unknown",
      description: charge.description || "Payment",
    }))
  } catch (error) {
    console.error("Error fetching Stripe payments:", error)
    return []
  }
}
