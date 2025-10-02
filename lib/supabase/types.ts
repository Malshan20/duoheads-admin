export interface Profile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  bio?: string
  school?: string
  major?: string
  grad_year?: string
  age?: number
  subscription_tier: string
  subscription_status: string
  subscription_start_date?: string
  subscription_end_date?: string
  paddle_customer_id?: string
  paddle_subscription_id?: string
  subscription_id?: string
  paddle_transaction_id?: string
  subscription_plan: string
  last_payment_date?: string
  subscription_current_period_end?: string
  email?: string
}

export interface Order {
  id: string
  customer_email: string
  customer_name: string
  product_name: string
  amount: number
  currency: string
  paddle_transaction_id?: string
  status: string
  tracking_number?: string
  shipping_status: string
  created_at: string
  updated_at: string
  price_amount?: number
  user_id?: string
  customer_phone?: string
  billing_address_line1?: string
  billing_address_line2?: string
  billing_city?: string
  billing_state?: string
  billing_postal_code?: string
  billing_country?: string
  shipping_address_line1?: string
  shipping_address_line2?: string
  shipping_city?: string
  shipping_state?: string
  shipping_postal_code?: string
  shipping_country?: string
  customer_date_of_birth?: string
  special_instructions?: string
  same_as_billing: boolean
  paddle_checkout_id?: number
}

export interface ContactMessage {
  id: string
  user_id?: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  ticket_number: string
  reply_token?: string
  created_at: string
  updated_at: string
  has_unread_replies?: boolean
}

export interface TutorSession {
  id: string
  user_id: string
  subject: string
  topic?: string
  created_at: string
  last_updated_at: string
}

export interface TutorMessage {
  id: string
  session_id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  audio_url?: string
}

export interface StressReliefChat {
  id: string
  user_id?: string
  message: string
  response: string
  age_group: "primary" | "teen" | "college"
  created_at: string
}

export interface DailyVoiceTutorUsage {
  id: string
  user_id: string
  date: string
  duration_seconds_today: number
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  user_id?: string
  name: string
  color?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  name: string
  price: number
  billing_cycle: string
  features?: any
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  user_id: string
  role: string
  created_at: string
  updated_at: string
  // Joined data from profiles
  full_name?: string
  username?: string
  email?: string
}

export interface MessageReply {
  id: string
  contact_message_id: string
  admin_id?: string
  reply_content: string
  is_from_admin: boolean
  created_at: string
  updated_at: string
  // Joined data
  admin_name?: string
  admin_email?: string
}
