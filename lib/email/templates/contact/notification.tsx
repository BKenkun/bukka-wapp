import * as React from "react"
import { Section } from "@react-email/components"
import { BaseEmail, EmailHeading, EmailText } from "../base"

interface ContactNotificationProps {
  name: string
  email: string
  subject: string
  message: string
  createdAt: string
}

export function ContactNotificationEmail({
  name,
  email,
  subject,
  message,
  createdAt,
}: ContactNotificationProps) {
  const date = new Date(createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <BaseEmail preview={`New contact message from ${name}: ${subject}`}>
      <EmailHeading>New Contact Message</EmailHeading>

      <EmailText>
        You have received a new message through the contact form.
      </EmailText>

      <Section style={{ backgroundColor: "#f4f4f5", padding: "16px", marginBottom: "16px" }}>
        <EmailText style={{ margin: "0 0 8px", fontWeight: "bold" }}>From:</EmailText>
        <EmailText style={{ margin: "0 0 16px" }}>{name} ({email})</EmailText>

        <EmailText style={{ margin: "0 0 8px", fontWeight: "bold" }}>Subject:</EmailText>
        <EmailText style={{ margin: "0 0 16px" }}>{subject}</EmailText>

        <EmailText style={{ margin: "0 0 8px", fontWeight: "bold" }}>Message:</EmailText>
        <EmailText style={{ margin: "0", whiteSpace: "pre-wrap" }}>{message}</EmailText>
      </Section>

      <EmailText style={{ fontSize: "12px", color: "#6b7280" }}>
        Received on {date}
      </EmailText>
    </BaseEmail>
  )
}
