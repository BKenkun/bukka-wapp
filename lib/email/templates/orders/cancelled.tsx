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
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Tu pedido #${orderNumber} ha sido cancelado`}>
      <EmailHeading>Pedido Cancelado</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        Te confirmamos que tu pedido <strong>#{orderNumber}</strong> ha sido
        cancelado.
      </EmailText>

      {reason && (
        <EmailInfoBox variant="info">
          <EmailText style={{ margin: 0, fontSize: "14px" }}>
            <strong>Motivo:</strong> {reason}
          </EmailText>
        </EmailInfoBox>
      )}

      {/* Items */}
      <Section style={itemsContainer}>
        <Text style={sectionTitle}>Productos del pedido</Text>
        {items.map((item, index) => (
          <Row key={index} style={itemRow}>
            <Column style={itemDetails}>
              <Text style={itemName}>{item.name}</Text>
              <Text style={itemQuantity}>Cantidad: {item.quantity}</Text>
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
        <Text style={refundTitle}>Información del reembolso</Text>
        <Text style={refundAmount_style}>
          Importe a reembolsar: <strong>{formatPrice(refundAmount)}</strong>
        </Text>
        {refundMethod && (
          <Text style={refundDetail}>
            Método: {refundMethod}
          </Text>
        )}
        <Text style={refundNote}>
          El reembolso puede tardar entre 5-10 días hábiles en reflejarse
          en tu cuenta, dependiendo de tu entidad bancaria.
        </Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/tienda`}>
          Volver a la Tienda
        </EmailButton>
      </div>

      <EmailText>
        Si tienes alguna pregunta sobre la cancelación o el reembolso,
        no dudes en contactarnos.
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
