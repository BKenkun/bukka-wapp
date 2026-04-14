import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionPaymentFailedProps {
  customerName: string
  planName: string
  amount: number
  retryDate?: Date
  reason?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionPaymentFailedTemplate({
  customerName,
  planName,
  amount,
  retryDate,
  reason,
}: SubscriptionPaymentFailedProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview="Issue with your subscription payment">
      <EmailHeading>Payment Issue</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        We were unable to process the payment for your{" "}
        <strong>{planName}</strong> subscription. To keep your access to premium
        content, please update your payment information.
      </EmailText>

      <EmailInfoBox variant="error">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          {reason || "The payment was declined by your bank or payment method."}
        </EmailText>
      </EmailInfoBox>

      <Section style={detailsBox}>
        <Text style={detailsTitle}>Details</Text>
        <Text style={detailItem}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={detailItem}>
          <strong>Amount:</strong> {formatPrice(amount)}
        </Text>
        {retryDate && (
          <Text style={detailItem}>
            <strong>Next retry:</strong> {formatDate(retryDate)}
          </Text>
        )}
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/mi-cuenta/facturacion`}>
          Update Payment Method
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        <strong>Why might the payment fail?</strong>
      </EmailText>
      <ul style={{ color: "#6b7280", fontSize: "14px", lineHeight: "24px" }}>
        <li>Expired or cancelled card</li>
        <li>Insufficient funds</li>
        <li>Card limit exceeded</li>
        <li>Bank blocked the transaction</li>
      </ul>

      <EmailText>
        If you don't update your payment method, your subscription may be
        cancelled and you'll lose access to all premium content.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const detailsBox = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const detailsTitle = {
  color: "#991b1b",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const detailItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
