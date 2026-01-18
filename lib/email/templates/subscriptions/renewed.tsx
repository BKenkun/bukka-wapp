import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionRenewedProps {
  customerName: string
  planName: string
  renewedAt: Date
  nextBillingDate: Date
  amount: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionRenewedTemplate({
  customerName,
  planName,
  renewedAt,
  nextBillingDate,
  amount,
}: SubscriptionRenewedProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Tu suscripción ${planName} ha sido renovada`}>
      <EmailHeading>Suscripción Renovada</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        Tu suscripción <strong>{planName}</strong> ha sido renovada
        correctamente. ¡Gracias por continuar con nosotros!
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Pago procesado correctamente el {formatDate(renewedAt)}
        </EmailText>
      </EmailInfoBox>

      <Section style={billingBox}>
        <Text style={billingTitle}>Resumen de facturación</Text>
        <Text style={billingDetail}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={billingDetail}>
          <strong>Importe:</strong> {formatPrice(amount)}
        </Text>
        <Text style={billingDetail}>
          <strong>Próximo cobro:</strong> {formatDate(nextBillingDate)}
        </Text>
      </Section>

      <EmailText>
        Continúa disfrutando de todo el contenido exclusivo que tenemos para ti.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/videos`}>
          Ver Contenido Nuevo
        </EmailButton>
      </div>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        Puedes gestionar tu suscripción en cualquier momento desde tu cuenta.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const billingBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const billingTitle = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const billingDetail = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
