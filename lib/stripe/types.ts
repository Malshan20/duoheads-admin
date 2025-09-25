export interface StripeRevenue {
  total: number
  monthly: number
  daily: number
  subscriptions: number
  oneTime: number
}

export interface StripeSubscription {
  id: string
  customer: string
  status: string
  current_period_start: number
  current_period_end: number
  amount: number
  currency: string
  product_name: string
}

export interface StripePayment {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  customer: string
  description: string
}
