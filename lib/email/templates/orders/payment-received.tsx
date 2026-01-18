import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface PaymentReceivedProps {
  customerName: string
  orderNumber: string
  amount: number
  paymentMethod?: string
  transactionId?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function PaymentReceivedTemplate({
  customerName,
  orderNumber,
  amount,
  paymentMethod,
  transactionId,
}: PaymentReceivedProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price)

  return (
    <BaseEmail preview={`Pago recibido para pedido #${orderNumber}`}>
      <EmailHeading>Pago Recibido</EmailHeading>

      <EmailText>
        Hola {customerName},
      </EmailText>

      <EmailText>
        Hemos recibido correctamente el pago de tu pedido. ¡Gracias por tu compra!
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Tu pago ha sido procesado correctamente.
        </EmailText>
      </EmailInfoBox>

      <Section style={paymentBox}>
        <Text style={paymentTitle}>Detalles del pago</Text>
        <Text style={paymentDetail}>
          <strong>Pedido:</strong> #{orderNumber}
        </Text>
        <Text style={paymentDetail}>
          <strong>Importe:</strong> {formatPrice(amount)}
        </Text>
        {paymentMethod && (
          <Text style={paymentDetail}>
            <strong>Método:</strong> {paymentMethod}
          </Text>
        )}
        {transactionId && (
          <Text style={paymentDetail}>
            <strong>ID Transacción:</strong> {transactionId}
          </Text>
        )}
      </Section>

      <EmailText>
        Tu pedido está siendo procesado y te enviaremos una actualización
        cuando sea enviado.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/mi-cuenta/pedidos`}>
          Ver Mi Pedido
        </EmailButton>
      </div>
    </BaseEmail>
  )
}

// Styles
const paymentBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const paymentTitle = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const paymentDetail = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
