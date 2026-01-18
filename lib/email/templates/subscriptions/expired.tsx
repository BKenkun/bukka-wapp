import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface SubscriptionExpiredProps {
  customerName: string
  planName: string
  expiredAt: Date
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function SubscriptionExpiredTemplate({
  customerName,
  planName,
  expiredAt,
}: SubscriptionExpiredProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(date)

  return (
    <BaseEmail preview="Tu suscripción ha expirado">
      <EmailHeading>Tu suscripción ha expirado</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        Tu suscripción <strong>{planName}</strong> expiró el{" "}
        {formatDate(expiredAt)}. Ya no tienes acceso al contenido premium.
      </EmailText>

      <EmailInfoBox variant="warning">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Renueva ahora para no perderte nuestro contenido exclusivo
        </EmailText>
      </EmailInfoBox>

      <Section style={missedBox}>
        <Text style={missedTitle}>Lo que te estás perdiendo:</Text>
        <Text style={missedItem}>❌ Acceso a videos exclusivos</Text>
        <Text style={missedItem}>❌ Descargas ilimitadas</Text>
        <Text style={missedItem}>❌ Contenido de acceso anticipado</Text>
        <Text style={missedItem}>❌ Descuentos especiales en la tienda</Text>
        <Text style={missedItem}>❌ Contenido Diamond Exclusive</Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/suscripciones`}>
          Renovar Suscripción
        </EmailButton>
      </div>

      <EmailText>
        ¿Tienes dudas sobre los planes? Echa un vistazo a todas las opciones
        y encuentra la que mejor se adapte a ti.
      </EmailText>

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={`${APP_URL}/suscripciones`}
          style={{
            color: "#FA4860",
            textDecoration: "underline",
            fontSize: "14px",
          }}
        >
          Ver todos los planes
        </a>
      </div>
    </BaseEmail>
  )
}

// Styles
const missedBox = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const missedTitle = {
  color: "#991b1b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
}

const missedItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
