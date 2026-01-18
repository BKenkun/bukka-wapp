import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionUpgradeProps {
  customerName: string
  previousPlan: string
  newPlan: string
  newFeatures: string[]
  effectiveDate: Date
  newAmount: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionUpgradeTemplate({
  customerName,
  previousPlan,
  newPlan,
  newFeatures,
  effectiveDate,
  newAmount,
}: SubscriptionUpgradeProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(date)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Has mejorado a ${newPlan}`}>
      <EmailHeading>Upgrade Confirmado</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        ¡Excelente decisión! Tu plan ha sido actualizado de{" "}
        <strong>{previousPlan}</strong> a <strong>{newPlan}</strong>.
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Tu nuevo plan está activo desde {formatDate(effectiveDate)}
        </EmailText>
      </EmailInfoBox>

      <Section style={upgradeBox}>
        <Text style={upgradeTitle}>🎉 Tu nuevo plan: {newPlan}</Text>
        <Text style={upgradePrice}>{formatPrice(newAmount)}/mes</Text>
      </Section>

      <Section style={featuresBox}>
        <Text style={featuresTitle}>Ahora tienes acceso a:</Text>
        {newFeatures.map((feature, index) => (
          <Text key={index} style={featureItem}>
            ✓ {feature}
          </Text>
        ))}
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/videos`}>
          Explorar Contenido Premium
        </EmailButton>
      </div>

      <EmailText>
        Gracias por confiar en nosotros. Disfruta de todos los beneficios
        de tu nuevo plan.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const upgradeBox = {
  backgroundColor: "#fdf2f8",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const upgradeTitle = {
  color: "#9d174d",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 8px",
}

const upgradePrice = {
  color: "#374151",
  fontSize: "18px",
  margin: "0",
}

const featuresBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const featuresTitle = {
  color: "#166534",
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
