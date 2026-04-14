import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText } from "../base"

interface CastingRejectedProps {
  applicantName: string
  submissionId: string
  customMessage?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function CastingRejectedTemplate({
  applicantName,
  submissionId,
  customMessage,
}: CastingRejectedProps) {
  return (
    <BaseEmail preview="Update on your casting application">
      <EmailHeading>Application Update</EmailHeading>

      <EmailText>
        Hi {applicantName},
      </EmailText>

      <EmailText>
        Thank you for your interest in joining the BUKKAKERY team and for
        taking the time to send us your application (#{submissionId}).
      </EmailText>

      <EmailText>
        After carefully reviewing your profile, we regret to inform you
        that we're unable to move forward with your application at this time.
      </EmailText>

      {customMessage && (
        <Section style={messageBox}>
          <Text style={messageTitle}>Message from the team:</Text>
          <Text style={messageText}>{customMessage}</Text>
        </Section>
      )}

      <Section style={infoBox}>
        <Text style={infoTitle}>Don't be discouraged</Text>
        <Text style={infoText}>
          This decision does not reflect your value as a person or professional.
          Our needs and criteria vary by project, and your profile may be a
          better fit for future opportunities.
        </Text>
      </Section>

      <EmailText>
        We encourage you to keep pursuing your path, and you're welcome to
        reapply in the future if your circumstances have changed.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/casting`}>
          View Casting Requirements
        </EmailButton>
      </div>

      <EmailText>
        We wish you great success in your future endeavors.
      </EmailText>

      <EmailText>
        Best regards,
        <br />
        The BUKKAKERY Team
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const messageBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  borderLeft: "4px solid #6b7280",
}

const messageTitle = {
  color: "#374151",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const messageText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
  fontStyle: "italic" as const,
}

const infoBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const infoTitle = {
  color: "#0369a1",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const infoText = {
  color: "#374151",
  fontSize: "14px",
  margin: "0",
}
