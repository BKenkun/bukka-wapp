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
    new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview="Problema con el pago de tu suscripción">
      <EmailHeading>Problema con tu pago</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        No hemos podido procesar el pago de tu suscripción{" "}
        <strong>{planName}</strong>. Para mantener tu acceso al contenido
        premium, necesitamos que actualices tu información de pago.
      </EmailText>

      <EmailInfoBox variant="error">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          {reason || "El pago ha sido rechazado por tu banco o método de pago."}
        </EmailText>
      </EmailInfoBox>

      <Section style={detailsBox}>
        <Text style={detailsTitle}>Detalles</Text>
        <Text style={detailItem}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={detailItem}>
          <strong>Importe:</strong> {formatPrice(amount)}
        </Text>
        {retryDate && (
          <Text style={detailItem}>
            <strong>Próximo intento:</strong> {formatDate(retryDate)}
          </Text>
        )}
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/mi-cuenta/facturacion`}>
          Actualizar Método de Pago
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        <strong>¿Por qué puede fallar el pago?</strong>
      </EmailText>
      <ul style={{ color: "#6b7280", fontSize: "14px", lineHeight: "24px" }}>
        <li>Tarjeta expirada o cancelada</li>
        <li>Fondos insuficientes</li>
        <li>Límite de la tarjeta excedido</li>
        <li>El banco bloqueó la transacción</li>
      </ul>

      <EmailText>
        Si no actualizas tu método de pago, tu suscripción podría cancelarse
        y perderás acceso a todo el contenido premium.
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
