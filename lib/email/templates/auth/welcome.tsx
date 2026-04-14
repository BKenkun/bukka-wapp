import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText } from "../base"

interface WelcomeEmailProps {
  name: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function WelcomeEmailTemplate({ name }: WelcomeEmailProps) {
  return (
    <BaseEmail preview="Your account has been verified. Explore all our exclusive content.">
      <EmailHeading>Welcome to BUKKAKERY</EmailHeading>

      <EmailText>
        Hi {name || "there"},
      </EmailText>

      <EmailText>
        Your account has been successfully verified. You now have full access to
        our platform with the highest quality exclusive content.
      </EmailText>

      <Section style={featuresContainer}>
        <Text style={featureTitle}>What you can do now:</Text>
        <Text style={featureItem}>✓ Browse our exclusive video collection</Text>
        <Text style={featureItem}>✓ Discover our performers</Text>
        <Text style={featureItem}>✓ Shop products in our store</Text>
        <Text style={featureItem}>✓ Subscribe for premium access</Text>
      </Section>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/videos`}>Browse Videos</EmailButton>
      </div>

      <EmailText>
        Want unlimited access to all our content? Check out our subscription
        plans to unlock exclusive videos, downloads, and much more.
      </EmailText>

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={`${APP_URL}/suscripciones`}
          style={{
            color: "#FA4860",
            textDecoration: "underline",
            fontSize: "16px",
          }}
        >
          View subscription plans
        </a>
      </div>

      <EmailText>
        If you have any questions, feel free to contact us.
      </EmailText>

      <EmailText>
        Best regards,
        <br />
        The BUKKAKERY Team
      </EmailText>
    </BaseEmail>
  )
}

const featuresContainer = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const featureTitle = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
}

const featureItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
  paddingLeft: "8px",
}
