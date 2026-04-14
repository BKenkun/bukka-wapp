import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface OrderDeliveredProps {
  customerName: string
  orderNumber: string
  deliveredAt: Date
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function OrderDeliveredTemplate({
  customerName,
  orderNumber,
  deliveredAt,
}: OrderDeliveredProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(deliveredAt)

  return (
    <BaseEmail preview={`Your order #${orderNumber} has been delivered`}>
      <EmailHeading>Order Delivered</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        Your order <strong>#{orderNumber}</strong> was successfully delivered on{" "}
        {formattedDate}.
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          We hope you enjoy your purchase! If you have any issues with
          the products, you have 14 days to request an exchange or return.
        </EmailText>
      </EmailInfoBox>

      <Section style={feedbackBox}>
        <Text style={feedbackTitle}>How was your experience?</Text>
        <Text style={feedbackText}>
          Your feedback is very important to us. We'd love to know
          what you think about the products you've received.
        </Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/tienda`}>
          Continue Shopping
        </EmailButton>
      </div>

      <EmailText>
        If you haven't received your order or there's an issue with the delivery,
        please contact our customer support team.
      </EmailText>

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={`${APP_URL}/contact`}
          style={{
            color: "#FA4860",
            textDecoration: "underline",
            fontSize: "14px",
          }}
        >
          Contact support
        </a>
      </div>
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
