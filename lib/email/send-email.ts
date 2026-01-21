import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "./resend"
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

    const { data, error } = await resend.emails.send({
      from: from || EMAIL_FROM,
      to,
      replyTo: settings.replyTo || EMAIL_REPLY_TO,
      subject,
      react,
    })

    // Log the email
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        template,
        status: error ? "failed" : "sent",
        resendId: data?.id,
        error: error?.message,
        metadata: metadata as object,
      },
    })

    if (error) {
      console.error("Resend error:", error)
      return { success: false, error }
    }

    return { success: true, data }
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
