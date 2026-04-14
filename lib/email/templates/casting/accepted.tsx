import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface CastingAcceptedProps {
  applicantName: string
  submissionId: string
  nextSteps?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function CastingAcceptedTemplate({
  applicantName,
  submissionId,
  nextSteps,
}: CastingAcceptedProps) {
  return (
    <BaseEmail preview="Your casting application has been accepted">
      <EmailHeading>Congratulations! You've been selected</EmailHeading>

      <EmailText>
        Hi {applicantName},
      </EmailText>

      <EmailText>
        We have great news! After reviewing your application, our team
        has decided that your profile is a perfect fit for what we're
        looking for at BUKKAKERY.
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Your application <strong>#{submissionId}</strong> has been{" "}
          <strong>ACCEPTED</strong>
        </EmailText>
      </EmailInfoBox>

      <Section style={celebrationBox}>
        <Text style={celebrationEmoji}>🎉</Text>
        <Text style={celebrationTitle}>Welcome to the team</Text>
        <Text style={celebrationText}>
          We're excited to have you with us
        </Text>
      </Section>

      {nextSteps ? (
        <Section style={nextStepsBox}>
          <Text style={nextStepsTitle}>Next Steps</Text>
          <Text style={nextStepsText}>{nextSteps}</Text>
        </Section>
      ) : (
        <Section style={nextStepsBox}>
          <Text style={nextStepsTitle}>Next Steps</Text>
          <Text style={nextStepsItem}>
            1. We'll get in touch to schedule a meeting
          </Text>
          <Text style={nextStepsItem}>
            2. We'll discuss contract details and conditions
          </Text>
          <Text style={nextStepsItem}>
            3. We'll plan your first recording session
          </Text>
        </Section>
      )}

      <EmailText>
        A member of our team will reach out to you very soon to discuss
        the next steps.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${APP_URL}/contact`}>
          Contact Us
        </EmailButton>
      </div>

      <EmailText>
        Thank you for trusting BUKKAKERY! We look forward to working with you.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const celebrationBox = {
  backgroundColor: "#fdf2f8",
  borderRadius: "8px",
  padding: "32px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const celebrationEmoji = {
  fontSize: "48px",
  margin: "0 0 16px",
}

const celebrationTitle = {
  color: "#9d174d",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 8px",
}

const celebrationText = {
  color: "#6b7280",
  fontSize: "16px",
  margin: "0",
}

const nextStepsBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const nextStepsTitle = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const nextStepsText = {
  color: "#374151",
  fontSize: "14px",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
}

const nextStepsItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
