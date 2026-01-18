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
  // Admin
  | "admin/new-casting"
  | "admin/new-order"
  | "admin/payment-failed"

export interface SendEmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  react: React.ReactElement
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
    "auth/verify-email": { subject: "Verifica tu email", enabled: true },
    "auth/welcome": { subject: "Bienvenido a BUKKAKERY", enabled: true },
    "auth/reset-password": { subject: "Recupera tu contraseña", enabled: true },
    "auth/password-changed": { subject: "Tu contraseña ha sido cambiada", enabled: true },
    "orders/confirmation": { subject: "Confirmación de pedido #{orderNumber}", enabled: true },
    "orders/payment-received": { subject: "Pago recibido - Pedido #{orderNumber}", enabled: true },
    "orders/processing": { subject: "Tu pedido está siendo procesado", enabled: true },
    "orders/shipped": { subject: "Tu pedido ha sido enviado", enabled: true },
    "orders/delivered": { subject: "Tu pedido ha sido entregado", enabled: true },
    "orders/cancelled": { subject: "Pedido cancelado", enabled: true },
    "orders/payment-failed": { subject: "Problema con tu pago", enabled: true },
    "subscriptions/activated": { subject: "Tu suscripción está activa", enabled: true },
    "subscriptions/renewal-reminder": { subject: "Tu suscripción expira pronto", enabled: true },
    "subscriptions/renewed": { subject: "Suscripción renovada", enabled: true },
    "subscriptions/cancelled": { subject: "Suscripción cancelada", enabled: true },
    "subscriptions/expired": { subject: "Tu suscripción ha expirado", enabled: true },
    "subscriptions/upgrade": { subject: "Upgrade confirmado", enabled: true },
    "subscriptions/downgrade": { subject: "Cambio de plan confirmado", enabled: true },
    "subscriptions/payment-failed": { subject: "Problema con el pago de tu suscripción", enabled: true },
    "casting/received": { subject: "Hemos recibido tu solicitud", enabled: true },
    "casting/reviewing": { subject: "Tu solicitud está en revisión", enabled: true },
    "casting/accepted": { subject: "Tu solicitud ha sido aceptada", enabled: true },
    "casting/rejected": { subject: "Actualización de tu solicitud", enabled: true },
  },
}
