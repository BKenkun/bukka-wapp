import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface RenewalReminderProps {
  customerName: string
  planName: string
  expirationDate: Date
  amount: number
  daysRemaining: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function RenewalReminderTemplate({
  customerName,
  planName,
  expirationDate,
  amount,
  daysRemaining,
}: RenewalReminderProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Your subscription expires in ${daysRemaining} days`}>
      <EmailHeading>Your subscription expires soon</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        We wanted to remind you that your <strong>{planName}</strong> subscription
        will expire in <strong>{daysRemaining} days</strong>.
      </EmailText>

      <EmailInfoBox variant="warning">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Expiration date: {formatDate(expirationDate)}
        </EmailText>
      </EmailInfoBox>

      <Section style={reminderBox}>
        <Text style={reminderTitle}>Don't lose your access</Text>
        <Text style={reminderText}>
          If your subscription expires, you'll lose access to:
        </Text>
        <Text style={reminderItem}>• Exclusive videos and premium content</Text>
        <Text style={reminderItem}>• Unlimited downloads</Text>
        <Text style={reminderItem}>• Early access content</Text>
        <Text style={reminderItem}>• Store discounts</Text>
      </Section>

      <Section style={priceBox}>
        <Text style={priceLabel}>Renew for just</Text>
        <Text style={priceAmount}>{formatPrice(amount)}/month</Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/suscripciones`}>
          Renew Now
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        If your payment method is set up, renewal will be automatic.
        If you need to update your payment information, please do so before
        the expiration date.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const reminderBox = {
  backgroundColor: "#fefce8",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const reminderTitle = {
  color: "#854d0e",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 12px",
}

const reminderText = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 12px",
}

const reminderItem = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 4px",
  paddingLeft: "8px",
}

const priceBox = {
  textAlign: "center" as const,
  margin: "24px 0",
}

const priceLabel = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
}

const priceAmount = {
  color: "#FA4860",
  fontSize: "32px",
  fontWeight: "700",
  margin: "8px 0 0",
}
