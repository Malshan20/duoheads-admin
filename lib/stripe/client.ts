import Stripe from "stripe"

console.log("[v0] Checking Stripe configuration...")
console.log("[v0] STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY)
console.log("[v0] STRIPE_SECRET_KEY length:", process.env.STRIPE_SECRET_KEY?.length || 0)

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })
  : null

export const isStripeConfigured = !!stripeSecretKey

export const isStripeConfiguredClient =
  typeof window !== "undefined" ? !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : !!process.env.STRIPE_SECRET_KEY

console.log("[v0] Stripe configured:", isStripeConfigured)
if (isStripeConfigured) {
  console.log("[v0] Stripe client initialized successfully")
} else {
  console.log("[v0] Stripe client not initialized - missing secret key")
}
