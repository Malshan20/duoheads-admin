import { stripe, isStripeConfigured } from "./client"
import { createClient } from "@/lib/supabase/client"

export interface StripeCustomer {
  id: string
  email: string
  name: string
  created: number
  subscriptions: {
    id: string
    status: string
    current_period_end: number
    plan_name: string
    amount: number
  }[]
  total_spent: number
}

export async function getStripeCustomers(): Promise<StripeCustomer[]> {
  if (!isStripeConfigured || !stripe) {
    // Return mock data when Stripe is not configured
    return [
      {
        id: "cus_mock_1",
        email: "john@example.com",
        name: "John Smith",
        created: Math.floor(Date.now() / 1000) - 86400 * 30,
        subscriptions: [
          {
            id: "sub_mock_1",
            status: "active",
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 15,
            plan_name: "Jungle Master Plan",
            amount: 29.99,
          },
        ],
        total_spent: 89.97,
      },
      {
        id: "cus_mock_2",
        email: "sarah@example.com",
        name: "Sarah Johnson",
        created: Math.floor(Date.now() / 1000) - 86400 * 45,
        subscriptions: [
          {
            id: "sub_mock_2",
            status: "active",
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 20,
            plan_name: "Forest Guardian Plan",
            amount: 19.99,
          },
        ],
        total_spent: 59.97,
      },
      {
        id: "cus_mock_3",
        email: "mike@example.com",
        name: "Mike Davis",
        created: Math.floor(Date.now() / 1000) - 86400 * 60,
        subscriptions: [],
        total_spent: 29.99,
      },
    ]
  }

  try {
    // Fetch customers from Stripe
    const customers = await stripe.customers.list({
      limit: 100,
      expand: ["data.subscriptions"],
    })

    // Get charges for each customer to calculate total spent
    const customersWithData = await Promise.all(
      customers.data.map(async (customer) => {
        // Get customer's charges to calculate total spent
        const charges = await stripe.charges.list({
          customer: customer.id,
          limit: 100,
        })

        const totalSpent =
          charges.data.filter((charge) => charge.paid).reduce((sum, charge) => sum + charge.amount, 0) / 100

        // Get active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          expand: ["data.items.data.price.product"],
        })

        return {
          id: customer.id,
          email: customer.email || "No email",
          name: customer.name || "No name",
          created: customer.created,
          subscriptions: subscriptions.data.map((sub) => ({
            id: sub.id,
            status: sub.status,
            current_period_end: sub.current_period_end,
            plan_name:
              typeof sub.items.data[0]?.price?.product === "string"
                ? "Product"
                : (sub.items.data[0]?.price?.product as any)?.name || "Unknown Plan",
            amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
          })),
          total_spent: totalSpent,
        }
      }),
    )

    return customersWithData
  } catch (error) {
    console.error("Error fetching Stripe customers:", error)
    return []
  }
}

export async function syncStripeCustomerWithProfile(stripeCustomerId: string, profileId: string) {
  if (!isStripeConfigured || !stripe) {
    console.log("Stripe not configured, skipping sync")
    return
  }

  try {
    const supabase = createClient()

    // Update the profile with the Stripe customer ID
    const { error } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", profileId)

    if (error) {
      console.error("Error syncing Stripe customer with profile:", error)
    }
  } catch (error) {
    console.error("Error syncing Stripe customer:", error)
  }
}

export async function getCustomerByEmail(email: string): Promise<StripeCustomer | null> {
  if (!isStripeConfigured || !stripe) {
    // Return mock data for testing
    const mockCustomers = await getStripeCustomers()
    return mockCustomers.find((customer) => customer.email === email) || null
  }

  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    if (customers.data.length === 0) {
      return null
    }

    const customer = customers.data[0]
    const charges = await stripe.charges.list({
      customer: customer.id,
      limit: 100,
    })

    const totalSpent =
      charges.data.filter((charge) => charge.paid).reduce((sum, charge) => sum + charge.amount, 0) / 100

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      expand: ["data.items.data.price.product"],
    })

    return {
      id: customer.id,
      email: customer.email || "No email",
      name: customer.name || "No name",
      created: customer.created,
      subscriptions: subscriptions.data.map((sub) => ({
        id: sub.id,
        status: sub.status,
        current_period_end: sub.current_period_end,
        plan_name:
          typeof sub.items.data[0]?.price?.product === "string"
            ? "Product"
            : (sub.items.data[0]?.price?.product as any)?.name || "Unknown Plan",
        amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
      })),
      total_spent: totalSpent,
    }
  } catch (error) {
    console.error("Error fetching customer by email:", error)
    return null
  }
}
