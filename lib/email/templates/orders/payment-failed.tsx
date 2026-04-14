import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface PaymentFailedProps {
  customerName: string
  orderNumber: string
  amount: number
  reason?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function PaymentFailedTemplate({
  customerName,
  orderNumber,
  amount,
  reason,
}: PaymentFailedProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Payment issue with order #${orderNumber}`}>
      <EmailHeading>Payment Issue</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        We're sorry to inform you that we were unable to process the payment
        for your order <strong>#{orderNumber}</strong>.
      </EmailText>

      <EmailInfoBox variant="error">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          {reason || "The payment was declined. Please verify your card details or try a different payment method."}
        </EmailText>
      </EmailInfoBox>

      <Section style={orderBox}>
        <Text style={orderTitle}>Order Details</Text>
        <Text style={orderDetail}>
          <strong>Order:</strong> #{orderNumber}
        </Text>
        <Text style={orderDetail}>
          <strong>Amount due:</strong> {formatPrice(amount)}
        </Text>
      </Section>

      <EmailText>
        To complete your purchase, please try making the payment again:
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/mi-cuenta/pedidos`}>
          Retry Payment
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        <strong>Possible reasons for failure:</strong>
      </EmailText>
      <ul style={{ color: "#6b7280", fontSize: "14px", lineHeight: "24px" }}>
        <li>Insufficient funds</li>
        <li>Incorrect card details</li>
        <li>Expired card</li>
        <li>Card limit exceeded</li>
        <li>Bank declined the transaction</li>
      </ul>

      <EmailText>
        If you need help, feel free to contact our support team.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const orderBox = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const orderTitle = {
  color: "#991b1b",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const orderDetail = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
