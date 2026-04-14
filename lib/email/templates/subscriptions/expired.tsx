import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionExpiredProps {
  customerName: string
  planName: string
  expiredAt: Date
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionExpiredTemplate({
  customerName,
  planName,
  expiredAt,
}: SubscriptionExpiredProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)

  return (
    <BaseEmail preview="Your subscription has expired">
      <EmailHeading>Your subscription has expired</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        Your <strong>{planName}</strong> subscription expired on{" "}
        {formatDate(expiredAt)}. You no longer have access to premium content.
      </EmailText>

      <EmailInfoBox variant="warning">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Renew now so you don't miss out on our exclusive content
        </EmailText>
      </EmailInfoBox>

      <Section style={missedBox}>
        <Text style={missedTitle}>What you're missing out on:</Text>
        <Text style={missedItem}>❌ Access to exclusive videos</Text>
        <Text style={missedItem}>❌ Unlimited downloads</Text>
        <Text style={missedItem}>❌ Early access content</Text>
        <Text style={missedItem}>❌ Special store discounts</Text>
        <Text style={missedItem}>❌ Diamond Exclusive content</Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/suscripciones`}>
          Renew Subscription
        </EmailButton>
      </div>

      <EmailText>
        Have questions about the plans? Take a look at all the options
        and find the one that best suits you.
      </EmailText>

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={`${APP_URL}/suscripciones`}
          style={{
            color: "#FA4860",
            textDecoration: "underline",
            fontSize: "14px",
          }}
        >
          View all plans
        </a>
      </div>
    </BaseEmail>
  )
}

// Styles
const missedBox = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const missedTitle = {
  color: "#991b1b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
}

const missedItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
