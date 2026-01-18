import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface OrderDeliveredProps {
  customerName: string
  orderNumber: string
  deliveredAt: Date
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function OrderDeliveredTemplate({
  customerName,
  orderNumber,
  deliveredAt,
}: OrderDeliveredProps) {
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(deliveredAt)

  return (
    <BaseEmail preview={`Tu pedido #${orderNumber} ha sido entregado`}>
      <EmailHeading>Pedido entregado</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        Tu pedido <strong>#{orderNumber}</strong> ha sido entregado con éxito el{" "}
        {formattedDate}.
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          ¡Esperamos que disfrutes tu compra! Si tienes algún problema con
          los productos, tienes 14 días para solicitar un cambio o devolución.
        </EmailText>
      </EmailInfoBox>

      <Section style={feedbackBox}>
        <Text style={feedbackTitle}>¿Qué te ha parecido?</Text>
        <Text style={feedbackText}>
          Tu opinión es muy importante para nosotros. Nos encantaría saber
          qué te han parecido los productos que has recibido.
        </Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/tienda`}>
          Seguir Comprando
        </EmailButton>
      </div>

      <EmailText>
        Si no has recibido tu pedido o hay algún problema con la entrega,
        por favor contacta con nuestro equipo de atención al cliente.
      </EmailText>

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={`${APP_URL}/contacto`}
          style={{
            color: "#FA4860",
            textDecoration: "underline",
            fontSize: "14px",
          }}
        >
          Contactar soporte
        </a>
      </div>
    </BaseEmail>
  )
}

// Styles
const feedbackBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const feedbackTitle = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const feedbackText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
}
