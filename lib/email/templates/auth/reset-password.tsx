import * as React from "react"
import { BaseEmail, EmailButton, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface ResetPasswordEmailProps {
  name: string
  resetUrl: string
}

export function ResetPasswordEmailTemplate({ name, resetUrl }: ResetPasswordEmailProps) {
  return (
    <BaseEmail preview="Has solicitado restablecer tu contraseña">
      <EmailHeading>Recupera tu contraseña</EmailHeading>

      <EmailText>
        Hola {name || "usuario"},
      </EmailText>

      <EmailText>
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta
        en BUKKAKERY. Si no realizaste esta solicitud, puedes ignorar este email.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={resetUrl}>Restablecer Contraseña</EmailButton>
      </div>

      <EmailInfoBox variant="warning">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Este enlace expirará en 1 hora por motivos de seguridad.
        </EmailText>
      </EmailInfoBox>

      <EmailText>
        Si no solicitaste restablecer tu contraseña, es posible que alguien esté
        intentando acceder a tu cuenta. Te recomendamos que revises la seguridad
        de tu cuenta.
      </EmailText>

      <EmailText style={{ color: "#6b7280", fontSize: "14px" }}>
        Si el botón no funciona, copia y pega este enlace en tu navegador:
        <br />
        <span style={{ color: "#FA4860", wordBreak: "break-all" }}>
          {resetUrl}
        </span>
      </EmailText>
    </BaseEmail>
  )
}
