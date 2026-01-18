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
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Problema con el pago del pedido #${orderNumber}`}>
      <EmailHeading>Problema con tu pago</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        Lamentamos informarte que no hemos podido procesar el pago de tu
        pedido <strong>#{orderNumber}</strong>.
      </EmailText>

      <EmailInfoBox variant="error">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          {reason || "El pago ha sido rechazado. Por favor, verifica los datos de tu tarjeta o intenta con otro método de pago."}
        </EmailText>
      </EmailInfoBox>

      <Section style={orderBox}>
        <Text style={orderTitle}>Detalles del pedido</Text>
        <Text style={orderDetail}>
          <strong>Pedido:</strong> #{orderNumber}
        </Text>
        <Text style={orderDetail}>
          <strong>Importe pendiente:</strong> {formatPrice(amount)}
        </Text>
      </Section>

      <EmailText>
        Para completar tu compra, por favor intenta realizar el pago de nuevo:
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/mi-cuenta/pedidos`}>
          Reintentar Pago
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        <strong>Posibles causas del fallo:</strong>
      </EmailText>
      <ul style={{ color: "#6b7280", fontSize: "14px", lineHeight: "24px" }}>
        <li>Fondos insuficientes</li>
        <li>Datos de la tarjeta incorrectos</li>
        <li>Tarjeta expirada</li>
        <li>Límite de la tarjeta excedido</li>
        <li>El banco rechazó la transacción</li>
      </ul>

      <EmailText>
        Si necesitas ayuda, no dudes en contactar con nuestro equipo de soporte.
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
