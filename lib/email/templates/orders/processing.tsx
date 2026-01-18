import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText } from "../base"

interface OrderProcessingProps {
  customerName: string
  orderNumber: string
  estimatedShipDate?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function OrderProcessingTemplate({
  customerName,
  orderNumber,
  estimatedShipDate,
}: OrderProcessingProps) {
  return (
    <BaseEmail preview={`Tu pedido #${orderNumber} está siendo preparado`}>
      <EmailHeading>Preparando tu pedido</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        Tu pedido <strong>#{orderNumber}</strong> está siendo preparado para el envío.
        Nuestro equipo está trabajando para que lo recibas lo antes posible.
      </EmailText>

      <Section style={statusBox}>
        <Text style={statusTitle}>Estado del pedido</Text>
        <div style={progressContainer}>
          <div style={{ ...progressStep, ...progressComplete }}>
            <Text style={stepText}>Confirmado</Text>
          </div>
          <div style={{ ...progressStep, ...progressCurrent }}>
            <Text style={stepText}>Procesando</Text>
          </div>
          <div style={progressStep}>
            <Text style={stepText}>Enviado</Text>
          </div>
          <div style={progressStep}>
            <Text style={stepText}>Entregado</Text>
          </div>
        </div>
        {estimatedShipDate && (
          <Text style={estimateText}>
            Fecha estimada de envío: {estimatedShipDate}
          </Text>
        )}
      </Section>

      <EmailText>
        Te enviaremos otro email con el número de seguimiento cuando tu
        pedido sea enviado.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/mi-cuenta/pedidos`}>
          Ver Mi Pedido
        </EmailButton>
      </div>

      <EmailText>
        Si tienes alguna pregunta, no dudes en contactarnos.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const statusBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const statusTitle = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
  textAlign: "center" as const,
}

const progressContainer = {
  display: "flex" as const,
  justifyContent: "space-between" as const,
  margin: "16px 0",
}

const progressStep = {
  flex: "1",
  textAlign: "center" as const,
  padding: "8px 4px",
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
  margin: "0",
}

const estimateText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "16px 0 0",
  textAlign: "center" as const,
}
