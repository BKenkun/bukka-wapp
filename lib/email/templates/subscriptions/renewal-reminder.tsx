import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface RenewalReminderProps {
  customerName: string
  planName: string
  expirationDate: Date
  amount: number
  daysRemaining: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function RenewalReminderTemplate({
  customerName,
  planName,
  expirationDate,
  amount,
  daysRemaining,
}: RenewalReminderProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Tu suscripción expira en ${daysRemaining} días`}>
      <EmailHeading>Tu suscripción expira pronto</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        Queremos recordarte que tu suscripción <strong>{planName}</strong>
        expirará en <strong>{daysRemaining} días</strong>.
      </EmailText>

      <EmailInfoBox variant="warning">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Fecha de expiración: {formatDate(expirationDate)}
        </EmailText>
      </EmailInfoBox>

      <Section style={reminderBox}>
        <Text style={reminderTitle}>No pierdas tu acceso</Text>
        <Text style={reminderText}>
          Si tu suscripción expira, perderás acceso a:
        </Text>
        <Text style={reminderItem}>• Videos exclusivos y contenido premium</Text>
        <Text style={reminderItem}>• Descargas ilimitadas</Text>
        <Text style={reminderItem}>• Contenido de acceso anticipado</Text>
        <Text style={reminderItem}>• Descuentos en la tienda</Text>
      </Section>

      <Section style={priceBox}>
        <Text style={priceLabel}>Renueva por solo</Text>
        <Text style={priceAmount}>{formatPrice(amount)}/mes</Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/suscripciones`}>
          Renovar Ahora
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        Si tu método de pago está configurado, la renovación será automática.
        Si necesitas actualizar tu información de pago, hazlo antes de la
        fecha de expiración.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const reminderBox = {
  backgroundColor: "#fefce8",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const reminderTitle = {
  color: "#854d0e",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 12px",
}

const reminderText = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 12px",
}

const reminderItem = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 4px",
  paddingLeft: "8px",
}

const priceBox = {
  textAlign: "center" as const,
  margin: "24px 0",
}

const priceLabel = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
}

const priceAmount = {
  color: "#FA4860",
  fontSize: "32px",
  fontWeight: "700",
  margin: "8px 0 0",
}
