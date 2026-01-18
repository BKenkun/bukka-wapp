import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionDowngradeProps {
  customerName: string
  previousPlan: string
  newPlan: string
  effectiveDate: Date
  newAmount: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionDowngradeTemplate({
  customerName,
  previousPlan,
  newPlan,
  effectiveDate,
  newAmount,
}: SubscriptionDowngradeProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Cambio de plan a ${newPlan} confirmado`}>
      <EmailHeading>Cambio de Plan Confirmado</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        Te confirmamos que tu plan ha sido cambiado de{" "}
        <strong>{previousPlan}</strong> a <strong>{newPlan}</strong>.
      </EmailText>

      <EmailInfoBox variant="info">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          El cambio será efectivo a partir del {formatDate(effectiveDate)}
        </EmailText>
      </EmailInfoBox>

      <Section style={planBox}>
        <Text style={planTitle}>Tu nuevo plan: {newPlan}</Text>
        <Text style={planPrice}>{formatPrice(newAmount)}/mes</Text>
      </Section>

      <EmailText>
        Hasta la fecha del cambio, seguirás disfrutando de todos los beneficios
        de tu plan actual <strong>{previousPlan}</strong>.
      </EmailText>

      <Section style={noteBox}>
        <Text style={noteTitle}>Ten en cuenta:</Text>
        <Text style={noteText}>
          Después del cambio, algunas funciones premium pueden dejar de estar
          disponibles. Siempre puedes volver a mejorar tu plan cuando lo desees.
        </Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/suscripciones`}>
          Ver Planes Disponibles
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        Si tienes alguna pregunta sobre el cambio, no dudes en contactarnos.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const planBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const planTitle = {
  color: "#374151",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const planPrice = {
  color: "#6b7280",
  fontSize: "16px",
  margin: "0",
}

const noteBox = {
  backgroundColor: "#fefce8",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const noteTitle = {
  color: "#854d0e",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const noteText = {
  color: "#374151",
  fontSize: "14px",
  margin: "0",
}
