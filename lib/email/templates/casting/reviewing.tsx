import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface CastingReviewingProps {
  applicantName: string
  submissionId: string
}

export function CastingReviewingTemplate({
  applicantName,
  submissionId,
}: CastingReviewingProps) {
  return (
    <BaseEmail preview="Tu solicitud de casting está siendo revisada">
      <EmailHeading>Solicitud en Revisión</EmailHeading>

      <EmailText>
        Hola {applicantName},
      </EmailText>

      <EmailText>
        Queremos informarte que tu solicitud de casting está siendo revisada
        activamente por nuestro equipo.
      </EmailText>

      <EmailInfoBox variant="info">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Referencia: <strong>{submissionId}</strong>
        </EmailText>
      </EmailInfoBox>

      <Section style={statusBox}>
        <div style={progressContainer}>
          <div style={{ ...progressStep, ...progressComplete }}>
            <Text style={stepText}>Recibida</Text>
          </div>
          <div style={{ ...progressStep, ...progressCurrent }}>
            <Text style={stepText}>En revisión</Text>
          </div>
          <div style={progressStep}>
            <Text style={stepText}>Decisión</Text>
          </div>
        </div>
      </Section>

      <EmailText>
        Estamos evaluando cuidadosamente tu perfil y los materiales que nos
        enviaste. Te contactaremos si necesitamos información adicional.
      </EmailText>

      <Section style={infoBox}>
        <Text style={infoTitle}>Mientras tanto...</Text>
        <Text style={infoText}>
          Asegúrate de tener tu teléfono y email disponibles por si necesitamos
          contactarte. También puedes preparar cualquier pregunta que tengas
          sobre el proceso.
        </Text>
      </Section>

      <EmailText>
        Recibirás un email con nuestra decisión en los próximos días.
        ¡Gracias por tu paciencia!
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const statusBox = {
  margin: "24px 0",
  padding: "16px 0",
}

const progressContainer = {
  display: "flex" as const,
  justifyContent: "space-between" as const,
}

const progressStep = {
  flex: "1",
  textAlign: "center" as const,
  padding: "12px 4px",
  borderBottom: "3px solid #e5e7eb",
}

const progressComplete = {
  borderBottomColor: "#22c55e",
}

const progressCurrent = {
  borderBottomColor: "#FA4860",
}

const stepText = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "500",
  margin: "0",
}

const infoBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const infoTitle = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const infoText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
}
