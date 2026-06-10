// Cliente mínimo de Mailjet (API v3.1 para envío, v3 REST para contactos).
// Se activa automáticamente cuando MAILJET_API_KEY y MAILJET_SECRET_KEY están definidas.

const MAILJET_SEND_URL = "https://api.mailjet.com/v3.1/send"
const MAILJET_CONTACT_URL = "https://api.mailjet.com/v3/REST/contact"

export function isMailjetConfigured(): boolean {
  return Boolean(process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY)
}

function authHeader(): string {
  const credentials = `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`
  return `Basic ${Buffer.from(credentials).toString("base64")}`
}

export interface MailjetSendOptions {
  fromEmail: string
  fromName: string
  to: string
  replyTo?: string
  subject: string
  html: string
}

export interface MailjetSendResult {
  id: string | null
  error: string | null
}

export async function sendViaMailjet({
  fromEmail,
  fromName,
  to,
  replyTo,
  subject,
  html,
}: MailjetSendOptions): Promise<MailjetSendResult> {
  try {
    const response = await fetch(MAILJET_SEND_URL, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: fromEmail, Name: fromName },
            To: [{ Email: to }],
            ...(replyTo ? { ReplyTo: { Email: replyTo } } : {}),
            Subject: subject,
            HTMLPart: html,
          },
        ],
      }),
    })

    const data = (await response.json().catch(() => null)) as {
      Messages?: Array<{
        Status?: string
        To?: Array<{ MessageID?: number | string }>
        Errors?: Array<{ ErrorMessage?: string }>
      }>
      ErrorMessage?: string
    } | null

    if (!response.ok) {
      return { id: null, error: data?.ErrorMessage || `Mailjet HTTP ${response.status}` }
    }

    const message = data?.Messages?.[0]
    if (message?.Status !== "success") {
      const errorMessage = message?.Errors?.map((e) => e.ErrorMessage).join(", ")
      return { id: null, error: errorMessage || "Mailjet send failed" }
    }

    const messageId = message.To?.[0]?.MessageID
    return { id: messageId != null ? String(messageId) : null, error: null }
  } catch (error) {
    return { id: null, error: error instanceof Error ? error.message : "Mailjet request failed" }
  }
}

/**
 * Da de alta (o reactiva) un contacto en Mailjet. Best-effort: nunca lanza.
 * Devuelve true si Mailjet aceptó el contacto (o ya existía).
 */
export async function upsertMailjetContact(email: string, name?: string): Promise<boolean> {
  if (!isMailjetConfigured()) return false
  try {
    const response = await fetch(MAILJET_CONTACT_URL, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Email: email, ...(name ? { Name: name } : {}) }),
    })
    // 201 creado; 400 con "already exists" también lo damos por bueno
    if (response.ok) return true
    const body = await response.text()
    if (response.status === 400 && body.includes("already exists")) return true
    console.error(`[Mailjet] Contact upsert failed (${response.status}): ${body.slice(0, 200)}`)
    return false
  } catch (error) {
    console.error("[Mailjet] Contact upsert error:", error)
    return false
  }
}
