import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionActivatedProps {
  customerName: string
  planName: string
  features: string[]
  startDate: Date
  nextBillingDate?: Date
  amount: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionActivatedTemplate({
  customerName,
  planName,
  features,
  startDate,
  nextBillingDate,
  amount,
}: SubscriptionActivatedProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Your ${planName} subscription is active`}>
      <EmailHeading>Subscription Activated</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        Welcome to the club! Your <strong>{planName}</strong> subscription is now
        active and you have access to all exclusive content.
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Your subscription was successfully activated on {formatDate(startDate)}
        </EmailText>
      </EmailInfoBox>

      <Section style={planBox}>
        <Text style={planTitle}>{planName}</Text>
        <Text style={planPrice}>{formatPrice(amount)}/month</Text>
        {nextBillingDate && (
          <Text style={planBilling}>
            Next billing date: {formatDate(nextBillingDate)}
          </Text>
        )}
      </Section>

      <Section style={featuresBox}>
        <Text style={featuresTitle}>You can now enjoy:</Text>
        {features.map((feature, index) => (
          <Text key={index} style={featureItem}>
            ✓ {feature}
          </Text>
        ))}
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/videos`}>
          Browse Exclusive Videos
        </EmailButton>
      </div>

      <EmailText>
        Thank you for choosing BUKKAKERY. If you have any questions about
        your subscription, we're here to help.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const planBox = {
  backgroundColor: "#fdf2f8",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const planTitle = {
  color: "#9d174d",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 8px",
}

const planPrice = {
  color: "#374151",
  fontSize: "18px",
  margin: "0 0 8px",
}

const planBilling = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
}

const featuresBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const featuresTitle = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
}

const featureItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
  paddingLeft: "8px",
}
