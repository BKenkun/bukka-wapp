// Main email functionality
export { sendEmail, sendTemplateEmail, getEmailSettings, isTemplateEnabled, getTemplateSubject } from "./send-email"
export { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "./resend"
export type { SendEmailOptions, EmailResult, EmailSettings, EmailTemplate } from "./types"
export { DEFAULT_EMAIL_SETTINGS } from "./types"

// Templates
export * from "./templates"
