import * as React from "react"
import { Section, Text, Row, Column, Hr } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText } from "../base"

interface OrderItem {
  name: string
  quantity: number
  price: number
  imageUrl?: string
}

interface ShippingAddress {
  name: string
  address: string
  city: string
  postalCode: string
  country: string
}

interface OrderConfirmationProps {
  customerName: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  shippingAddress: ShippingAddress
  estimatedDelivery?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function OrderConfirmationTemplate({
  customerName,
  orderNumber,
  items,
  subtotal,
  shipping,
  discount,
  total,
  shippingAddress,
  estimatedDelivery,
}: OrderConfirmationProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Confirmación de pedido #${orderNumber}`}>
      <EmailHeading>Pedido Confirmado</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        ¡Gracias por tu compra! Hemos recibido tu pedido y estamos preparándolo
        para el envío. A continuación encontrarás los detalles de tu pedido.
      </EmailText>

      <Section style={orderBox}>
        <Text style={orderNumber_style}>Pedido #{orderNumber}</Text>
        {estimatedDelivery && (
          <Text style={deliveryEstimate}>
            Entrega estimada: {estimatedDelivery}
          </Text>
        )}
      </Section>

      {/* Items */}
      <Section style={itemsContainer}>
        <Text style={sectionTitle}>Productos</Text>
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

      {/* Totals */}
      <Section style={totalsContainer}>
        <Row style={totalRow}>
          <Column style={totalLabel}>
            <Text style={totalText}>Subtotal</Text>
          </Column>
          <Column style={totalValue}>
            <Text style={totalText}>{formatPrice(subtotal)}</Text>
          </Column>
        </Row>
        {discount > 0 && (
          <Row style={totalRow}>
            <Column style={totalLabel}>
              <Text style={discountText}>Descuento</Text>
            </Column>
            <Column style={totalValue}>
              <Text style={discountText}>-{formatPrice(discount)}</Text>
            </Column>
          </Row>
        )}
        <Row style={totalRow}>
          <Column style={totalLabel}>
            <Text style={totalText}>Envío</Text>
          </Column>
          <Column style={totalValue}>
            <Text style={totalText}>
              {shipping === 0 ? "GRATIS" : formatPrice(shipping)}
            </Text>
          </Column>
        </Row>
        <Row style={totalRow}>
          <Column style={totalLabel}>
            <Text style={grandTotalText}>Total</Text>
          </Column>
          <Column style={totalValue}>
            <Text style={grandTotalText}>{formatPrice(total)}</Text>
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Shipping Address */}
      <Section style={addressContainer}>
        <Text style={sectionTitle}>Dirección de envío</Text>
        <Text style={addressText}>
          {shippingAddress.name}
          <br />
          {shippingAddress.address}
          <br />
          {shippingAddress.postalCode} {shippingAddress.city}
          <br />
          {shippingAddress.country}
        </Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/mi-cuenta/pedidos`}>
          Ver Mi Pedido
        </EmailButton>
      </div>

      <EmailText>
        Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const orderBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "16px 24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const orderNumber_style = {
  color: "#166534",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0",
}

const deliveryEstimate = {
  color: "#166534",
  fontSize: "14px",
  margin: "8px 0 0",
}

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
  marginBottom: "16px",
}

const itemDetails = {
  verticalAlign: "top" as const,
}

const itemName = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0",
}

const itemQuantity = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "4px 0 0",
}

const itemPrice = {
  textAlign: "right" as const,
  verticalAlign: "top" as const,
}

const priceText = {
  color: "#111827",
  fontSize: "16px",
  margin: "0",
}

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
}

const totalsContainer = {
  margin: "24px 0",
}

const totalRow = {
  marginBottom: "8px",
}

const totalLabel = {
  verticalAlign: "top" as const,
}

const totalValue = {
  textAlign: "right" as const,
  verticalAlign: "top" as const,
}

const totalText = {
  color: "#374151",
  fontSize: "14px",
  margin: "0",
}

const discountText = {
  color: "#22c55e",
  fontSize: "14px",
  margin: "0",
}

const grandTotalText = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0",
}

const addressContainer = {
  margin: "24px 0",
}

const addressText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0",
}
