import * as React from "react"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface ResetPasswordEmailProps {
  name: string
  resetUrl: string
}

export function ResetPasswordEmailTemplate({ name, resetUrl }: ResetPasswordEmailProps) {
  return (
    <BaseEmail preview="You have requested to reset your password">
      <EmailHeading>Reset Your Password</EmailHeading>

      <EmailText>
        Hi {name || "there"},
      </EmailText>

      <EmailText>
        We received a request to reset the password for your BUKKAKERY account.
        If you did not make this request, you can ignore this email.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={resetUrl}>Reset Password</EmailButton>
      </div>

      <EmailInfoBox variant="warning">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          This link will expire in 1 hour for security reasons.
        </EmailText>
      </EmailInfoBox>

      <EmailText>
        If you did not request a password reset, someone may be trying to access
        your account. We recommend reviewing your account security.
      </EmailText>

      <EmailText style={{ color: "#6b7280", fontSize: "14px" }}>
        If the button doesn't work, copy and paste this link into your browser:
        <br />
        <span style={{ color: "#FA4860", wordBreak: "break-all" }}>
          {resetUrl}
        </span>
      </EmailText>
    </BaseEmail>
  )
}
