import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/client"
import { createClient } from "@/lib/supabase/server"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")!

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const supabase = await createClient()

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object
        // Update user subscription status in database
        await supabase
          .from("profiles")
          .update({
            subscription_status: subscription.status,
            subscription_tier: subscription.items.data[0]?.price?.nickname || "Jungle Master",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", subscription.customer)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object
        // Update user subscription status to cancelled
        await supabase
          .from("profiles")
          .update({
            subscription_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", deletedSubscription.customer)
        break

      case "invoice.payment_succeeded":
        const invoice = event.data.object
        // Log successful payment
        console.log("Payment succeeded for invoice:", invoice.id)
        break

      case "invoice.payment_failed":
        const failedInvoice = event.data.object
        // Handle failed payment
        console.log("Payment failed for invoice:", failedInvoice.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
