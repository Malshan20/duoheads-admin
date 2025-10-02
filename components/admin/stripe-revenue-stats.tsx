import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStripeRevenue } from "@/lib/stripe/revenue"
import { isStripeConfigured } from "@/lib/stripe/client"
import { DollarSign, CreditCard, TrendingUp, Users, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export async function StripeRevenueStats() {
  const revenue = await getStripeRevenue()

  const stats = [
    {
      title: "Total Revenue",
      value: `$${revenue.total.toLocaleString()}`,
      icon: DollarSign,
      description: "All-time revenue",
      color: "text-green-600",
    },
    {
      title: "Monthly Revenue",
      value: `$${revenue.monthly.toLocaleString()}`,
      icon: TrendingUp,
      description: "This month",
      color: "text-blue-600",
    },
    {
      title: "Daily Revenue",
      value: `$${revenue.daily.toLocaleString()}`,
      icon: CreditCard,
      description: "Today",
      color: "text-purple-600",
    },
    {
      title: "Subscription Revenue",
      value: `$${revenue.subscriptions.toLocaleString()}`,
      icon: Users,
      description: "Monthly recurring",
      color: "text-emerald-600",
    },
  ]

  return (
    <div className="space-y-4">
      {!isStripeConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Stripe is not configured. Add STRIPE_SECRET_KEY to see real revenue data.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
