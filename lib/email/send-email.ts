import { render } from "@react-email/components"
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "./resend"
import { isMailjetConfigured, sendViaMailjet } from "./mailjet"
import { prisma } from "@/lib/prisma"
import type { SendEmailOptions, EmailResult, EmailSettings } from "./types"
import { DEFAULT_EMAIL_SETTINGS } from "./types"

// Get email settings from database
async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: "email_settings" },
    })
    if (settings?.value) {
      return { ...DEFAULT_EMAIL_SETTINGS, ...(settings.value as unknown as EmailSettings) }
    }
  } catch (error) {
    console.error("Error fetching email settings:", error)
  }
  return DEFAULT_EMAIL_SETTINGS
}

// Check if template is enabled
async function isTemplateEnabled(template: string): Promise<boolean> {
  const settings = await getEmailSettings()
  return settings.templates[template]?.enabled ?? true
}

// Get template subject with variable replacement
async function getTemplateSubject(
  template: string,
  variables: Record<string, string> = {}
): Promise<string> {
  const settings = await getEmailSettings()
  let subject = settings.templates[template]?.subject || template

  // Replace variables like {orderNumber}
  Object.entries(variables).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(`\\{${key}\\}|#\\{${key}\\}`, "g"), value)
  })

  return subject
}

export async function sendEmail({
  to,
  subject,
  template,
  react,
  html,
  metadata,
}: SendEmailOptions): Promise<EmailResult> {
  try {
    // Check if template is enabled
    const enabled = await isTemplateEnabled(template)
    if (!enabled) {
      console.log(`Email template ${template} is disabled, skipping...`)
      return { success: true, data: { id: "skipped" } }
    }

    // Get settings for from address
    const settings = await getEmailSettings()
    const from = `${settings.fromName} <${settings.fromEmail}>`
    const replyTo = settings.replyTo || EMAIL_REPLY_TO

    let messageId: string | undefined
    let sendError: { message: string } | undefined

    if (isMailjetConfigured()) {
      // Proveedor: Mailjet (prioritario si hay claves configuradas)
      const htmlBody = html ?? (react ? await render(react) : undefined)
      if (!htmlBody) {
        return { success: false, error: new Error("No email content provided") }
      }
      const result = await sendViaMailjet({
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        to,
        replyTo,
        subject,
        html: htmlBody,
      })
      messageId = result.id ?? undefined
      sendError = result.error ? { message: result.error } : undefined
    } else {
      // Proveedor: Resend (fallback)
      const { data, error } = await resend.emails.send({
        from: from || EMAIL_FROM,
        to,
        replyTo,
        subject,
        ...(html ? { html } : { react }),
      })
      messageId = data?.id
      sendError = error ? { message: error.message } : undefined
    }

    // Log the email
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        template,
        status: sendError ? "failed" : "sent",
        resendId: messageId,
        error: sendError?.message,
        metadata: metadata as object,
      },
    })

    if (sendError) {
      console.error("Email provider error:", sendError.message)
      return { success: false, error: sendError }
    }

    return { success: true, data: { id: messageId ?? "unknown" } }
  } catch (err) {
    console.error("Email send error:", err)

    // Log failed attempt
    try {
      await prisma.emailLog.create({
        data: {
          to,
          subject,
          template,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
          metadata: metadata as object,
        },
      })
    } catch {
      // Ignore logging errors
    }

    return { success: false, error: err }
  }
}

// Helper to send email with auto subject from settings
export async function sendTemplateEmail({
  to,
  template,
  react,
  subjectVariables = {},
  metadata,
}: Omit<SendEmailOptions, "subject"> & {
  subjectVariables?: Record<string, string>
}): Promise<EmailResult> {
  const subject = await getTemplateSubject(template, subjectVariables)
  return sendEmail({ to, subject, template, react, metadata })
}

export { getEmailSettings, isTemplateEnabled, getTemplateSubject }
