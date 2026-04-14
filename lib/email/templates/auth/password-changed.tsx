import * as React from "react"
import { BaseEmail, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface PasswordChangedEmailProps {
  name: string
  changedAt: Date
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function PasswordChangedEmailTemplate({ name, changedAt }: PasswordChangedEmailProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(changedAt)

  return (
    <BaseEmail preview="Your password has been successfully updated">
      <EmailHeading>Password Updated</EmailHeading>

      <EmailText>
        Hi {name || "there"},
      </EmailText>

      <EmailText>
        We confirm that your password was successfully updated on{" "}
        <strong>{formattedDate}</strong>.
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Your account is secure. You can now sign in with your new password.
        </EmailText>
      </EmailInfoBox>

      <EmailText>
        If you did not make this change, please immediately contact our support
        team or request a new password reset.
      </EmailText>

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={`${APP_URL}/auth/forgot-password`}
          style={{
            color: "#FA4860",
            textDecoration: "underline",
            fontSize: "14px",
          }}
        >
          Reset password if this wasn't me
        </a>
      </div>

      <EmailText>
        For your security, we recommend:
      </EmailText>

      <ul style={{ color: "#374151", fontSize: "14px", lineHeight: "24px" }}>
        <li>Using unique passwords for each service</li>
        <li>Never sharing your password with anyone</li>
        <li>Signing out on public devices</li>
      </ul>

      <EmailText>
        Best regards,
        <br />
        The BUKKAKERY Team
      </EmailText>
    </BaseEmail>
  )
}
