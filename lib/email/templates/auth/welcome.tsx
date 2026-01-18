import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText } from "../base"

interface WelcomeEmailProps {
  name: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function WelcomeEmailTemplate({ name }: WelcomeEmailProps) {
  return (
    <BaseEmail preview="Tu cuenta ha sido verificada. Explora todo nuestro contenido exclusivo.">
      <EmailHeading>Bienvenido a BUKKAKERY</EmailHeading>

      <EmailText>
        Hola {name || "usuario"},
      </EmailText>

      <EmailText>
        Tu cuenta ha sido verificada correctamente. Ahora tienes acceso completo a
        nuestra plataforma con contenido exclusivo de la más alta calidad.
      </EmailText>

      <Section style={featuresContainer}>
        <Text style={featureTitle}>Lo que puedes hacer ahora:</Text>
        <Text style={featureItem}>✓ Explorar nuestra colección de videos exclusivos</Text>
        <Text style={featureItem}>✓ Descubrir a nuestras performers</Text>
        <Text style={featureItem}>✓ Comprar productos en nuestra tienda</Text>
        <Text style={featureItem}>✓ Suscribirte para acceso premium</Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/videos`}>Explorar Videos</EmailButton>
      </div>

      <EmailText>
        ¿Quieres acceso ilimitado a todo nuestro contenido? Echa un vistazo a
        nuestros planes de suscripción para desbloquear videos exclusivos,
        descargas y mucho más.
      </EmailText>

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={`${APP_URL}/suscripciones`}
          style={{
            color: "#FA4860",
            textDecoration: "underline",
            fontSize: "16px",
          }}
        >
          Ver planes de suscripción
        </a>
      </div>

      <EmailText>
        Si tienes alguna pregunta, no dudes en contactarnos.
      </EmailText>

      <EmailText>
        Atentamente,
        <br />
        El equipo de BUKKAKERY
      </EmailText>
    </BaseEmail>
  )
}

const featuresContainer = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const featureTitle = {
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
