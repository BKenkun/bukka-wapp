import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionUpgradeProps {
  customerName: string
  previousPlan: string
  newPlan: string
  newFeatures: string[]
  effectiveDate: Date
  newAmount: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionUpgradeTemplate({
  customerName,
  previousPlan,
  newPlan,
  newFeatures,
  effectiveDate,
  newAmount,
}: SubscriptionUpgradeProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`You've upgraded to ${newPlan}`}>
      <EmailHeading>Upgrade Confirmed</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        Excellent choice! Your plan has been upgraded from{" "}
        <strong>{previousPlan}</strong> to <strong>{newPlan}</strong>.
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Your new plan is active since {formatDate(effectiveDate)}
        </EmailText>
      </EmailInfoBox>

      <Section style={upgradeBox}>
        <Text style={upgradeTitle}>🎉 Your new plan: {newPlan}</Text>
        <Text style={upgradePrice}>{formatPrice(newAmount)}/month</Text>
      </Section>

      <Section style={featuresBox}>
        <Text style={featuresTitle}>You now have access to:</Text>
        {newFeatures.map((feature, index) => (
          <Text key={index} style={featureItem}>
            ✓ {feature}
          </Text>
        ))}
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/videos`}>
          Browse Premium Content
        </EmailButton>
      </div>

      <EmailText>
        Thank you for trusting us. Enjoy all the benefits of your new plan.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const upgradeBox = {
  backgroundColor: "#fdf2f8",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const upgradeTitle = {
  color: "#9d174d",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 8px",
}

const upgradePrice = {
  color: "#374151",
  fontSize: "18px",
  margin: "0",
}

const featuresBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const featuresTitle = {
  color: "#166534",
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
