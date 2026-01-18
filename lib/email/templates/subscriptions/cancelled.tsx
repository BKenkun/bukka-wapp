import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionCancelledProps {
  customerName: string
  planName: string
  endDate: Date
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionCancelledTemplate({
  customerName,
  planName,
  endDate,
}: SubscriptionCancelledProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(date)

  return (
    <BaseEmail preview="Tu suscripción ha sido cancelada">
      <EmailHeading>Suscripción Cancelada</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        Te confirmamos que tu suscripción <strong>{planName}</strong> ha sido
        cancelada. No te preocupes, no se realizarán más cobros.
      </EmailText>

      <EmailInfoBox variant="info">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Aún tienes acceso hasta el <strong>{formatDate(endDate)}</strong>
        </EmailText>
      </EmailInfoBox>

      <Section style={feedbackBox}>
        <Text style={feedbackTitle}>Lamentamos verte partir</Text>
        <Text style={feedbackText}>
          Si hay algo que podamos hacer para mejorar, nos encantaría escucharte.
          Tu opinión nos ayuda a ofrecer un mejor servicio.
        </Text>
      </Section>

      <EmailText>
        Recuerda que siempre puedes volver cuando quieras. Tu cuenta seguirá
        activa y podrás reactivar tu suscripción en cualquier momento.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/suscripciones`}>
          Reactivar Suscripción
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        Si cancelaste por error o tienes alguna pregunta, no dudes en
        contactar con nuestro equipo de soporte.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const feedbackBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const feedbackTitle = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const feedbackText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
}
