import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface PaymentReceivedProps {
  customerName: string
  orderNumber: string
  amount: number
  paymentMethod?: string
  transactionId?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function PaymentReceivedTemplate({
  customerName,
  orderNumber,
  amount,
  paymentMethod,
  transactionId,
}: PaymentReceivedProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Payment received for order #${orderNumber}`}>
      <EmailHeading>Payment Received</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        We've successfully received the payment for your order. Thank you for your purchase!
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Your payment has been successfully processed.
        </EmailText>
      </EmailInfoBox>

      <Section style={paymentBox}>
        <Text style={paymentTitle}>Payment Details</Text>
        <Text style={paymentDetail}>
          <strong>Order:</strong> #{orderNumber}
        </Text>
        <Text style={paymentDetail}>
          <strong>Amount:</strong> {formatPrice(amount)}
        </Text>
        {paymentMethod && (
          <Text style={paymentDetail}>
            <strong>Method:</strong> {paymentMethod}
          </Text>
        )}
        {transactionId && (
          <Text style={paymentDetail}>
            <strong>Transaction ID:</strong> {transactionId}
          </Text>
        )}
      </Section>

      <EmailText>
        Your order is being processed and we'll send you an update
        when it ships.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/mi-cuenta/pedidos`}>
          View My Order
        </EmailButton>
      </div>
    </BaseEmail>
  )
}

// Styles
const paymentBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const paymentTitle = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const paymentDetail = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
