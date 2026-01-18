import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface CastingAcceptedProps {
  applicantName: string
  submissionId: string
  nextSteps?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function CastingAcceptedTemplate({
  applicantName,
  submissionId,
  nextSteps,
}: CastingAcceptedProps) {
  return (
    <BaseEmail preview="Tu solicitud de casting ha sido aceptada">
      <EmailHeading>¡Felicidades! Has sido seleccionada</EmailHeading>

      <EmailText>
        Hola {applicantName},
      </EmailText>

      <EmailText>
        ¡Tenemos excelentes noticias! Después de revisar tu solicitud, nuestro
        equipo ha decidido que tu perfil encaja perfectamente con lo que
        buscamos en BUKKAKERY.
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Tu solicitud <strong>#{submissionId}</strong> ha sido{" "}
          <strong>ACEPTADA</strong>
        </EmailText>
      </EmailInfoBox>

      <Section style={celebrationBox}>
        <Text style={celebrationEmoji}>🎉</Text>
        <Text style={celebrationTitle}>Bienvenida al equipo</Text>
        <Text style={celebrationText}>
          Estamos emocionados de tenerte con nosotros
        </Text>
      </Section>

      {nextSteps ? (
        <Section style={nextStepsBox}>
          <Text style={nextStepsTitle}>Próximos pasos</Text>
          <Text style={nextStepsText}>{nextSteps}</Text>
        </Section>
      ) : (
        <Section style={nextStepsBox}>
          <Text style={nextStepsTitle}>Próximos pasos</Text>
          <Text style={nextStepsItem}>
            1. Nos pondremos en contacto contigo para coordinar una reunión
          </Text>
          <Text style={nextStepsItem}>
            2. Discutiremos los detalles del contrato y condiciones
          </Text>
          <Text style={nextStepsItem}>
            3. Planificaremos tu primera sesión de grabación
          </Text>
        </Section>
      )}

      <EmailText>
        Un miembro de nuestro equipo se pondrá en contacto contigo muy pronto
        para discutir los siguientes pasos.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/contacto`}>
          Contactar con Nosotros
        </EmailButton>
      </div>

      <EmailText>
        ¡Gracias por confiar en BUKKAKERY! Estamos deseando trabajar contigo.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const celebrationBox = {
  backgroundColor: "#fdf2f8",
  borderRadius: "8px",
  padding: "32px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const celebrationEmoji = {
  fontSize: "48px",
  margin: "0 0 16px",
}

const celebrationTitle = {
  color: "#9d174d",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 8px",
}

const celebrationText = {
  color: "#6b7280",
  fontSize: "16px",
  margin: "0",
}

const nextStepsBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const nextStepsTitle = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const nextStepsText = {
  color: "#374151",
  fontSize: "14px",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
}

const nextStepsItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
