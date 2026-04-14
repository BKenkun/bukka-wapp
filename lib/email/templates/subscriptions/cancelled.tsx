import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionCancelledProps {
  customerName: string
  planName: string
  endDate: Date
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionCancelledTemplate({
  customerName,
  planName,
  endDate,
}: SubscriptionCancelledProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)

  return (
    <BaseEmail preview="Your subscription has been cancelled">
      <EmailHeading>Subscription Cancelled</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        We confirm that your <strong>{planName}</strong> subscription has been
        cancelled. Don't worry, no further charges will be made.
      </EmailText>

      <EmailInfoBox variant="info">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          You still have access until <strong>{formatDate(endDate)}</strong>
        </EmailText>
      </EmailInfoBox>

      <Section style={feedbackBox}>
        <Text style={feedbackTitle}>We're sorry to see you go</Text>
        <Text style={feedbackText}>
          If there's anything we can do to improve, we'd love to hear from you.
          Your feedback helps us provide a better service.
        </Text>
      </Section>

      <EmailText>
        Remember, you can always come back whenever you want. Your account will
        remain active and you can reactivate your subscription at any time.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/suscripciones`}>
          Reactivate Subscription
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        If you cancelled by mistake or have any questions, feel free to
        contact our support team.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const feedbackBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const feedbackTitle = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const feedbackText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
}
