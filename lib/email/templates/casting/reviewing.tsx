import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface CastingReviewingProps {
  applicantName: string
  submissionId: string
}

export function CastingReviewingTemplate({
  applicantName,
  submissionId,
}: CastingReviewingProps) {
  return (
    <BaseEmail preview="Your casting application is under review">
      <EmailHeading>Application Under Review</EmailHeading>

      <EmailText>
        Hi {applicantName},
      </EmailText>

      <EmailText>
        We wanted to let you know that your casting application is being
        actively reviewed by our team.
      </EmailText>

      <EmailInfoBox variant="info">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Reference: <strong>{submissionId}</strong>
        </EmailText>
      </EmailInfoBox>

      <Section style={statusBox}>
        <div style={progressContainer}>
          <div style={{ ...progressStep, ...progressComplete }}>
            <Text style={stepText}>Received</Text>
          </div>
          <div style={{ ...progressStep, ...progressCurrent }}>
            <Text style={stepText}>Under Review</Text>
          </div>
          <div style={progressStep}>
            <Text style={stepText}>Decision</Text>
          </div>
        </div>
      </Section>

      <EmailText>
        We're carefully evaluating your profile and the materials you sent us.
        We'll contact you if we need additional information.
      </EmailText>

      <Section style={infoBox}>
        <Text style={infoTitle}>In the meantime...</Text>
        <Text style={infoText}>
          Make sure your phone and email are available in case we need to
          reach you. You can also prepare any questions you may have
          about the process.
        </Text>
      </Section>

      <EmailText>
        You'll receive an email with our decision in the coming days.
        Thank you for your patience!
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const statusBox = {
  margin: "24px 0",
  padding: "16px 0",
}

const progressContainer = {
  display: "flex" as const,
  justifyContent: "space-between" as const,
}

const progressStep = {
  flex: "1",
  textAlign: "center" as const,
  padding: "12px 4px",
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
  fontWeight: "500",
  margin: "0",
}

const infoBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const infoTitle = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const infoText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
}
