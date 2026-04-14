import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionRenewedProps {
  customerName: string
  planName: string
  renewedAt: Date
  nextBillingDate: Date
  amount: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionRenewedTemplate({
  customerName,
  planName,
  renewedAt,
  nextBillingDate,
  amount,
}: SubscriptionRenewedProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Your ${planName} subscription has been renewed`}>
      <EmailHeading>Subscription Renewed</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        Your <strong>{planName}</strong> subscription has been successfully
        renewed. Thank you for staying with us!
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Payment successfully processed on {formatDate(renewedAt)}
        </EmailText>
      </EmailInfoBox>

      <Section style={billingBox}>
        <Text style={billingTitle}>Billing Summary</Text>
        <Text style={billingDetail}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={billingDetail}>
          <strong>Amount:</strong> {formatPrice(amount)}
        </Text>
        <Text style={billingDetail}>
          <strong>Next billing date:</strong> {formatDate(nextBillingDate)}
        </Text>
      </Section>

      <EmailText>
        Keep enjoying all the exclusive content we have for you.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/videos`}>
          View New Content
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        You can manage your subscription at any time from your account.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const billingBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const billingTitle = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const billingDetail = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
