"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Search, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getStripeCustomers } from "@/lib/stripe/customers"
import { isStripeConfigured } from "@/lib/stripe/client"
import type { StripeCustomer } from "@/lib/stripe/customers"

export function StripeCustomersTable() {
  const [customers, setCustomers] = useState<StripeCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getStripeCustomers()
        setCustomers(data)
      } catch (error) {
        console.error("Error fetching customers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getSubscriptionStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Customers</CardTitle>
          <CardDescription>Loading customer data...</CardDescription>
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
        <CardTitle>Stripe Customers</CardTitle>
        <CardDescription>
          {isStripeConfigured ? "Real customer data from Stripe" : "Mock customer data (Stripe not configured)"}
        </CardDescription>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isStripeConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Showing mock customer data. Configure Stripe to see real customer information.
            </AlertDescription>
          </Alert>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subscriptions</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Customer Since</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-sm text-muted-foreground font-mono">{customer.id}</span>
                  </div>
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {customer.subscriptions.length > 0 ? (
                      customer.subscriptions.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2">
                          <Badge className={getSubscriptionStatusColor(sub.status)}>{sub.status}</Badge>
                          <span className="text-sm">{sub.plan_name}</span>
                          <span className="text-sm text-muted-foreground">${sub.amount}/mo</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No active subscriptions</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">${customer.total_spent.toFixed(2)}</span>
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(customer.created * 1000), { addSuffix: true })}</TableCell>
                <TableCell className="text-right">
                  {isStripeConfigured && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`https://dashboard.stripe.com/customers/${customer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
