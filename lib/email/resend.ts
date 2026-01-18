import { Resend } from "resend"

// Lazy initialization to avoid errors during build
let resendClient: Resend | null = null

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not configured. Email sending is disabled.")
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

// For backwards compatibility
export const resend = {
  emails: {
    send: async (options: Parameters<Resend["emails"]["send"]>[0]) => {
      const client = getResendClient()
      if (!client) {
        return { data: null, error: new Error("Resend not configured") }
      }
      return client.emails.send(options)
    },
  },
}

export const EMAIL_FROM = process.env.EMAIL_FROM || "BUKKAKERY <noreply@bukkakery.com>"
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "soporte@bukkakery.com"
