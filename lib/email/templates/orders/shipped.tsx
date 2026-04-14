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
    <BaseEmail preview={`Your order #${orderNumber} is on its way`}>
      <EmailHeading>Your order is on its way</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        Great news! Your order <strong>#{orderNumber}</strong> has been
        shipped and is on its way to you.
      </EmailText>

      <Section style={trackingBox}>
        <Text style={trackingTitle}>Tracking Information</Text>
        {carrier && <Text style={trackingDetail}>Carrier: {carrier}</Text>}
        {trackingNumber && (
          <Text style={trackingNumber_style}>
            Tracking number: <strong>{trackingNumber}</strong>
          </Text>
        )}
        {estimatedDelivery && (
          <Text style={trackingDetail}>
            Estimated delivery: {estimatedDelivery}
          </Text>
        )}
      </Section>

      {trackingUrl && (
        <div style={{ textAlign: "center", margin: "24px 0" }}>
          <EmailButton href={trackingUrl}>Track Shipment</EmailButton>
        </div>
      )}

      <Hr style={divider} />

      <EmailInfoBox variant="info">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          You'll receive your package in the coming days. If you're not home,
          the carrier may leave a notice or attempt delivery at another time.
        </EmailText>
      </EmailInfoBox>

      <EmailText>
        If you have any questions about your shipment, feel free to contact us.
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
          View order details
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
