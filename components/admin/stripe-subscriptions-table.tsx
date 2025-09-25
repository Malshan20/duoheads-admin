"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { getStripeSubscriptions } from "@/lib/stripe/revenue"
import { getStripeCustomers } from "@/lib/stripe/customers"
import { isStripeConfigured } from "@/lib/stripe/client"
import type { StripeSubscription } from "@/lib/stripe/types"
import { formatDistanceToNow } from "date-fns"
import { AlertCircle } from "lucide-react"

export function StripeSubscriptionsTable() {
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const [subscriptionData, customerData] = await Promise.all([getStripeSubscriptions(), getStripeCustomers()])
        setSubscriptions(subscriptionData)
        setCustomers(customerData)
      } catch (error) {
        console.error("Error fetching subscriptions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "canceled":
        return "bg-red-100 text-red-800"
      case "past_due":
        return "bg-yellow-100 text-yellow-800"
      case "unpaid":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCustomerName = (email: string) => {
    const customer = customers.find((c) => c.email === email)
    return customer?.name || email
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Subscriptions</CardTitle>
          <CardDescription>Loading subscription data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Subscriptions</CardTitle>
        <CardDescription>
          {isStripeConfigured
            ? "Manage customer subscriptions from Stripe"
            : "Mock subscription data (Stripe not configured)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isStripeConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Showing mock subscription data. Configure Stripe to see real subscriptions.
            </AlertDescription>
          </Alert>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Billing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-medium">{getCustomerName(subscription.customer)}</span>
                    <span className="text-sm text-muted-foreground">{subscription.customer}</span>
                  </div>
                </TableCell>
                <TableCell>{subscription.product_name}</TableCell>
                <TableCell>
                  ${subscription.amount}/{subscription.currency}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(subscription.current_period_end * 1000), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
