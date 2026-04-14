import * as React from "react"
import { BaseEmail, EmailButton, EmailHeading, EmailText } from "../base"

interface VerifyEmailProps {
  name: string
  verificationUrl: string
}

export function VerifyEmailTemplate({ name, verificationUrl }: VerifyEmailProps) {
  return (
    <BaseEmail preview="Verify your email address to complete your registration">
      <EmailHeading>Verify Your Email</EmailHeading>

      <EmailText>
        Hi {name || "there"},
      </EmailText>

      <EmailText>
        Thanks for signing up for BUKKAKERY. To complete your registration and access
        all our exclusive content, please verify your email address by clicking the
        button below.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={verificationUrl}>Verify Email</EmailButton>
      </div>

      <EmailText>
        This link will expire in 24 hours. If you did not request this email,
        you can safely ignore it.
      </EmailText>

      <EmailText style={{ color: "#6b7280", fontSize: "14px" }}>
        If the button doesn't work, copy and paste this link into your browser:
        <br />
        <span style={{ color: "#FA4860", wordBreak: "break-all" }}>
          {verificationUrl}
        </span>
      </EmailText>
    </BaseEmail>
  )
}
