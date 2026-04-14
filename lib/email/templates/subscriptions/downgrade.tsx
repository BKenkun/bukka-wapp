import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionDowngradeProps {
  customerName: string
  previousPlan: string
  newPlan: string
  effectiveDate: Date
  newAmount: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionDowngradeTemplate({
  customerName,
  previousPlan,
  newPlan,
  effectiveDate,
  newAmount,
}: SubscriptionDowngradeProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Plan change to ${newPlan} confirmed`}>
      <EmailHeading>Plan Change Confirmed</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        We confirm that your plan has been changed from{" "}
        <strong>{previousPlan}</strong> to <strong>{newPlan}</strong>.
      </EmailText>

      <EmailInfoBox variant="info">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          The change will take effect on {formatDate(effectiveDate)}
        </EmailText>
      </EmailInfoBox>

      <Section style={planBox}>
        <Text style={planTitle}>Your new plan: {newPlan}</Text>
        <Text style={planPrice}>{formatPrice(newAmount)}/month</Text>
      </Section>

      <EmailText>
        Until the change date, you'll continue to enjoy all the benefits
        of your current <strong>{previousPlan}</strong> plan.
      </EmailText>

      <Section style={noteBox}>
        <Text style={noteTitle}>Please note:</Text>
        <Text style={noteText}>
          After the change, some premium features may no longer be available.
          You can always upgrade your plan again whenever you wish.
        </Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/suscripciones`}>
          View Available Plans
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        If you have any questions about the change, feel free to contact us.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const planBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const planTitle = {
  color: "#374151",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const planPrice = {
  color: "#6b7280",
  fontSize: "16px",
  margin: "0",
}

const noteBox = {
  backgroundColor: "#fefce8",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const noteTitle = {
  color: "#854d0e",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const noteText = {
  color: "#374151",
  fontSize: "14px",
  margin: "0",
}
