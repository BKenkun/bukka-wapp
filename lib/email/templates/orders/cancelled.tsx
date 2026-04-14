import * as React from "react"
import { Section, Text, Row, Column, Hr } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderCancelledProps {
  customerName: string
  orderNumber: string
  reason?: string
  items: OrderItem[]
  refundAmount: number
  refundMethod?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function OrderCancelledTemplate({
  customerName,
  orderNumber,
  reason,
  items,
  refundAmount,
  refundMethod,
}: OrderCancelledProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Your order #${orderNumber} has been cancelled`}>
      <EmailHeading>Order Cancelled</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        We confirm that your order <strong>#{orderNumber}</strong> has been
        cancelled.
      </EmailText>

      {reason && (
        <EmailInfoBox variant="info">
          <EmailText style={{ margin: 0, fontSize: "14px" }}>
            <strong>Reason:</strong> {reason}
          </EmailText>
        </EmailInfoBox>
      )}

      {/* Items */}
      <Section style={itemsContainer}>
        <Text style={sectionTitle}>Order Items</Text>
        {items.map((item, index) => (
          <Row key={index} style={itemRow}>
            <Column style={itemDetails}>
              <Text style={itemName}>{item.name}</Text>
              <Text style={itemQuantity}>Quantity: {item.quantity}</Text>
            </Column>
            <Column style={itemPrice}>
              <Text style={priceText}>{formatPrice(item.price * item.quantity)}</Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Hr style={divider} />

      {/* Refund Info */}
      <Section style={refundBox}>
        <Text style={refundTitle}>Refund Information</Text>
        <Text style={refundAmount_style}>
          Refund amount: <strong>{formatPrice(refundAmount)}</strong>
        </Text>
        {refundMethod && (
          <Text style={refundDetail}>
            Method: {refundMethod}
          </Text>
        )}
        <Text style={refundNote}>
          The refund may take 5-10 business days to appear in your account,
          depending on your bank.
        </Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/tienda`}>
          Back to Store
        </EmailButton>
      </div>

      <EmailText>
        If you have any questions about the cancellation or refund,
        feel free to contact us.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const itemsContainer = {
  margin: "24px 0",
}

const sectionTitle = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 16px",
}

const itemRow = {
  marginBottom: "12px",
}

const itemDetails = {
  verticalAlign: "top" as const,
}

const itemName = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
  textDecoration: "line-through" as const,
}

const itemQuantity = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "4px 0 0",
}

const itemPrice = {
  textAlign: "right" as const,
  verticalAlign: "top" as const,
}

const priceText = {
  color: "#9ca3af",
  fontSize: "14px",
  margin: "0",
  textDecoration: "line-through" as const,
}

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
}

const refundBox = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const refundTitle = {
  color: "#991b1b",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 12px",
}

const refundAmount_style = {
  color: "#374151",
  fontSize: "16px",
  margin: "0 0 8px",
}

const refundDetail = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 12px",
}

const refundNote = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0",
  fontStyle: "italic" as const,
}
