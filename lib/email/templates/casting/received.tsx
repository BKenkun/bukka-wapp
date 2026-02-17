import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface CastingReceivedProps {
  applicantName: string
  submissionId: string
  submittedAt: Date
}

export function CastingReceivedTemplate({
  applicantName,
  submissionId,
  submittedAt,
}: CastingReceivedProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date)

  return (
    <BaseEmail preview="Hemos recibido tu solicitud de casting">
      <EmailHeading>Solicitud Recibida</EmailHeading>

      <EmailText>
        Hola {applicantName},
      </EmailText>

      <EmailText>
        Hemos recibido correctamente tu solicitud para unirte a nuestro equipo
        de actrices. ¡Gracias por tu interés en BUKKAKERY!
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Tu solicitud ha sido registrada el {formatDate(submittedAt)}
        </EmailText>
      </EmailInfoBox>

      <Section style={detailsBox}>
        <Text style={detailsTitle}>Detalles de tu solicitud</Text>
        <Text style={detailItem}>
          <strong>Número de referencia:</strong> {submissionId}
        </Text>
        <Text style={detailItem}>
          <strong>Estado:</strong> Pendiente de revisión
        </Text>
      </Section>

      <Section style={nextStepsBox}>
        <Text style={nextStepsTitle}>¿Qué sigue?</Text>
        <Text style={nextStepsItem}>
          1. Nuestro equipo revisará tu solicitud y materiales
        </Text>
        <Text style={nextStepsItem}>
          2. Te contactaremos si necesitamos información adicional
        </Text>
        <Text style={nextStepsItem}>
          3. Recibirás una respuesta por email con nuestra decisión
        </Text>
      </Section>

      <EmailText>
        El proceso de revisión suele tardar entre 5 y 10 días laborables.
        Te notificaremos tan pronto como tengamos una actualización.
      </EmailText>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        Si tienes alguna pregunta mientras tanto, puedes responder a este
        email o contactarnos a través de nuestra página de contacto.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const detailsBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const detailsTitle = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const detailItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}

const nextStepsBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const nextStepsTitle = {
  color: "#0369a1",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const nextStepsItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
