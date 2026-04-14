import * as React from "react"
import { Section, Text } from "@react-email/components"
import { BaseEmail, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface CastingReceivedProps {
  applicantName: string
  submissionId: string
  submittedAt: Date
}

export function CastingReceivedTemplate({
  applicantName,
  submissionId,
  submittedAt,
}: CastingReceivedProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date)

  return (
    <BaseEmail preview="We've received your casting application">
      <EmailHeading>Application Received</EmailHeading>

      <EmailText>
        Hi {applicantName},
      </EmailText>

      <EmailText>
        We've successfully received your application to join our team
        of performers. Thank you for your interest in BUKKAKERY!
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Your application was registered on {formatDate(submittedAt)}
        </EmailText>
      </EmailInfoBox>

      <Section style={detailsBox}>
        <Text style={detailsTitle}>Application Details</Text>
        <Text style={detailItem}>
          <strong>Reference number:</strong> {submissionId}
        </Text>
        <Text style={detailItem}>
          <strong>Status:</strong> Pending review
        </Text>
      </Section>

      <Section style={nextStepsBox}>
        <Text style={nextStepsTitle}>What's next?</Text>
        <Text style={nextStepsItem}>
          1. Our team will review your application and materials
        </Text>
        <Text style={nextStepsItem}>
          2. We'll contact you if we need additional information
        </Text>
        <Text style={nextStepsItem}>
          3. You'll receive an email with our decision
        </Text>
      </Section>

      <EmailText>
        The review process typically takes 5 to 10 business days.
        We'll notify you as soon as we have an update.
      </EmailText>

      <EmailText style={{ fontSize: "14px", color: "#6b7280" }}>
        If you have any questions in the meantime, you can reply to this
        email or contact us through our contact page.
      </EmailText>
    </BaseEmail>
  )
}

// Styles
const detailsBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const detailsTitle = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const detailItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}

const nextStepsBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
}

const nextStepsTitle = {
  color: "#0369a1",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const nextStepsItem = {
  color: "#374151",
  fontSize: "14px",
  margin: "0 0 8px",
}
