import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText } from "../base"

interface CastingRejectedProps {
  applicantName: string
  submissionId: string
  customMessage?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function CastingRejectedTemplate({
  applicantName,
  submissionId,
  customMessage,
}: CastingRejectedProps) {
  return (
    <BaseEmail preview="Actualización sobre tu solicitud de casting">
      <EmailHeading>Actualización de tu Solicitud</EmailHeading>

      <EmailText>
        Hola {applicantName},
      </EmailText>

      <EmailText>
        Gracias por tu interés en formar parte del equipo de BUKKAKERY y por
        tomarte el tiempo de enviarnos tu solicitud (#{submissionId}).
      </EmailText>

      <EmailText>
        Después de revisar cuidadosamente tu perfil, lamentamos comunicarte
        que en esta ocasión no podremos continuar con tu solicitud.
      </EmailText>

      {customMessage && (
        <Section style={messageBox}>
          <Text style={messageTitle}>Mensaje del equipo:</Text>
          <Text style={messageText}>{customMessage}</Text>
        </Section>
      )}

      <Section style={infoBox}>
        <Text style={infoTitle}>No te desanimes</Text>
        <Text style={infoText}>
          Esta decisión no refleja tu valor como persona o profesional.
          Nuestras necesidades y criterios varían según los proyectos, y
          tu perfil podría encajar mejor en futuras oportunidades.
        </Text>
      </Section>

      <EmailText>
        Te animamos a que sigas tu camino y, si lo deseas, puedes volver a
        aplicar en el futuro si consideras que tu situación ha cambiado.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/casting`}>
          Ver Requisitos de Casting
        </EmailButton>
      </div>

      <EmailText>
        Te deseamos mucho éxito en tus proyectos futuros.
      </EmailText>

      <EmailText>
        Atentamente,
        <br />
        El equipo de BUKKAKERY
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const messageBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  borderLeft: "4px solid #6b7280",
}

const messageTitle = {
  color: "#374151",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const messageText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
  fontStyle: "italic" as const,
}

const infoBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const infoTitle = {
  color: "#0369a1",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const infoText = {
  color: "#374151",
  fontSize: "14px",
  margin: "0",
}
