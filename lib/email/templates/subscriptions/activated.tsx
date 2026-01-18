import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionActivatedProps {
  customerName: string
  planName: string
  features: string[]
  startDate: Date
  nextBillingDate?: Date
  amount: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionActivatedTemplate({
  customerName,
  planName,
  features,
  startDate,
  nextBillingDate,
  amount,
}: SubscriptionActivatedProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Tu suscripción ${planName} está activa`}>
      <EmailHeading>Suscripción Activada</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        ¡Bienvenido al club! Tu suscripción <strong>{planName}</strong> ya está
        activa y tienes acceso a todo el contenido exclusivo.
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Tu suscripción se activó correctamente el {formatDate(startDate)}
        </EmailText>
      </EmailInfoBox>

      <Section style={planBox}>
        <Text style={planTitle}>{planName}</Text>
        <Text style={planPrice}>{formatPrice(amount)}/mes</Text>
        {nextBillingDate && (
          <Text style={planBilling}>
            Próximo cobro: {formatDate(nextBillingDate)}
          </Text>
        )}
      </Section>

      <Section style={featuresBox}>
        <Text style={featuresTitle}>Ahora puedes disfrutar de:</Text>
        {features.map((feature, index) => (
          <Text key={index} style={featureItem}>
            ✓ {feature}
          </Text>
        ))}
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/videos`}>
          Explorar Videos Exclusivos
        </EmailButton>
      </div>

      <EmailText>
        Gracias por confiar en BUKKAKERY. Si tienes alguna pregunta sobre
        tu suscripción, estamos aquí para ayudarte.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const planBox = {
  backgroundColor: "#fdf2f8",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const planTitle = {
  color: "#9d174d",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 8px",
}

const planPrice = {
  color: "#374151",
  fontSize: "18px",
  margin: "0 0 8px",
}

const planBilling = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
}

const featuresBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const featuresTitle = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
}

const featureItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
  paddingLeft: "8px",
}
