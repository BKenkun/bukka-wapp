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
    <BaseEmail preview={`Your order #${orderNumber} is being prepared`}>
      <EmailHeading>Preparing Your Order</EmailHeading>

      <EmailText>
        Hi {customerName},
      </EmailText>

      <EmailText>
        Your order <strong>#{orderNumber}</strong> is being prepared for shipping.
        Our team is working to get it to you as soon as possible.
      </EmailText>

      <Section style={statusBox}>
        <Text style={statusTitle}>Order Status</Text>
        <div style={progressContainer}>
          <div style={{ ...progressStep, ...progressComplete }}>
            <Text style={stepText}>Confirmed</Text>
          </div>
          <div style={{ ...progressStep, ...progressCurrent }}>
            <Text style={stepText}>Processing</Text>
          </div>
          <div style={progressStep}>
            <Text style={stepText}>Shipped</Text>
          </div>
          <div style={progressStep}>
            <Text style={stepText}>Delivered</Text>
          </div>
        </div>
        {estimatedShipDate && (
          <Text style={estimateText}>
            Estimated ship date: {estimatedShipDate}
          </Text>
        )}
      </Section>

      <EmailText>
        We'll send you another email with the tracking number when your
        order ships.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/mi-cuenta/pedidos`}>
          View My Order
        </EmailButton>
      </div>

      <EmailText>
        If you have any questions, feel free to contact us.
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
