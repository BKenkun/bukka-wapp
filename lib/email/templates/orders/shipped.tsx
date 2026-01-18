import * as React from "react"
import { Section, Text, Hr } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface OrderShippedProps {
  customerName: string
  orderNumber: string
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: string
  trackingUrl?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function OrderShippedTemplate({
  customerName,
  orderNumber,
  trackingNumber,
  carrier,
  estimatedDelivery,
  trackingUrl,
}: OrderShippedProps) {
  return (
    <BaseEmail preview={`Tu pedido #${orderNumber} está en camino`}>
      <EmailHeading>Tu pedido está en camino</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        ¡Buenas noticias! Tu pedido <strong>#{orderNumber}</strong> ha sido
        enviado y está en camino hacia ti.
      </EmailText>

      <Section style={trackingBox}>
        <Text style={trackingTitle}>Información de seguimiento</Text>
        {carrier && <Text style={trackingDetail}>Transportista: {carrier}</Text>}
        {trackingNumber && (
          <Text style={trackingNumber_style}>
            Nº de seguimiento: <strong>{trackingNumber}</strong>
          </Text>
        )}
        {estimatedDelivery && (
          <Text style={trackingDetail}>
            Entrega estimada: {estimatedDelivery}
          </Text>
        )}
      </Section>

      {trackingUrl && (
        <div style={{ textAlign: "center", margin: "24px 0" }}>
          <EmailButton href={trackingUrl}>Rastrear Envío</EmailButton>
        </div>
      )}

      <Hr style={divider} />

      <EmailInfoBox variant="info">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Recibirás tu paquete en los próximos días. Si no estás en casa,
          el transportista puede dejar un aviso o intentar la entrega en
          otro momento.
        </EmailText>
      </EmailInfoBox>

      <EmailText>
        Si tienes alguna pregunta sobre tu envío, no dudes en contactarnos.
      </EmailText>

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={`${APP_URL}/mi-cuenta/pedidos`}
          style={{
            color: "#FA4860",
            textDecoration: "underline",
            fontSize: "14px",
          }}
        >
          Ver detalles del pedido
        </a>
      </div>
    </BaseEmail>
  )
}

// Styles
const trackingBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const trackingTitle = {
  color: "#0369a1",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const trackingDetail = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}

const trackingNumber_style = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
}
