export type EmailTemplate =
  // Auth
  | "auth/verify-email"
  | "auth/welcome"
  | "auth/reset-password"
  | "auth/password-changed"
  // Orders
  | "orders/confirmation"
  | "orders/payment-received"
  | "orders/processing"
  | "orders/shipped"
  | "orders/delivered"
  | "orders/cancelled"
  | "orders/payment-failed"
  // Subscriptions
  | "subscriptions/activated"
  | "subscriptions/renewal-reminder"
  | "subscriptions/renewed"
  | "subscriptions/cancelled"
  | "subscriptions/expired"
  | "subscriptions/upgrade"
  | "subscriptions/downgrade"
  | "subscriptions/payment-failed"
  // Casting
  | "casting/received"
  | "casting/reviewing"
  | "casting/accepted"
  | "casting/rejected"
  // Contact
  | "contact/notification"
  // Performer
  | "performer/available"
  // Admin
  | "admin/new-casting"
  | "admin/new-order"
  | "admin/payment-failed"

export interface SendEmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  react?: React.ReactElement
  html?: string
  metadata?: Record<string, unknown>
}

export interface EmailResult {
  success: boolean
  data?: { id: string }
  error?: Error | unknown
}

export interface EmailSettings {
  fromName: string
  fromEmail: string
  replyTo: string
  logoUrl: string | null
  primaryColor: string
  templates: Record<
    string,
    {
      subject: string
      enabled: boolean
    }
  >
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  fromName: "BUKKAKERY",
  fromEmail: "noreply@bukkakery.com",
  replyTo: "soporte@bukkakery.com",
  logoUrl: null,
  primaryColor: "#FA4860",
  templates: {
    "auth/verify-email": { subject: "Verify your email", enabled: true },
    "auth/welcome": { subject: "Welcome to BUKKAKERY", enabled: true },
    "auth/reset-password": { subject: "Reset your password", enabled: true },
    "auth/password-changed": { subject: "Your password has been changed", enabled: true },
    "orders/confirmation": { subject: "Order confirmation #{orderNumber}", enabled: true },
    "orders/payment-received": { subject: "Payment received - Order #{orderNumber}", enabled: true },
    "orders/processing": { subject: "Your order is being processed", enabled: true },
    "orders/shipped": { subject: "Your order has been shipped", enabled: true },
    "orders/delivered": { subject: "Your order has been delivered", enabled: true },
    "orders/cancelled": { subject: "Order cancelled", enabled: true },
    "orders/payment-failed": { subject: "Problem with your payment", enabled: true },
    "subscriptions/activated": { subject: "Your subscription is active", enabled: true },
    "subscriptions/renewal-reminder": { subject: "Your subscription expires soon", enabled: true },
    "subscriptions/renewed": { subject: "Subscription renewed", enabled: true },
    "subscriptions/cancelled": { subject: "Subscription cancelled", enabled: true },
    "subscriptions/expired": { subject: "Your subscription has expired", enabled: true },
    "subscriptions/upgrade": { subject: "Upgrade confirmed", enabled: true },
    "subscriptions/downgrade": { subject: "Plan change confirmed", enabled: true },
    "subscriptions/payment-failed": { subject: "Problem with your subscription payment", enabled: true },
    "casting/received": { subject: "We have received your application", enabled: true },
    "casting/reviewing": { subject: "Your application is under review", enabled: true },
    "casting/accepted": { subject: "Your application has been accepted", enabled: true },
    "casting/rejected": { subject: "Update on your application", enabled: true },
  },
}
