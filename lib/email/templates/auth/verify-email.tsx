import * as React from "react"
import { BaseEmail, EmailButton, EmailHeading, EmailText } from "../base"

interface VerifyEmailProps {
  name: string
  verificationUrl: string
}

export function VerifyEmailTemplate({ name, verificationUrl }: VerifyEmailProps) {
  return (
    <BaseEmail preview="Verifica tu dirección de email para completar tu registro">
      <EmailHeading>Verifica tu email</EmailHeading>

      <EmailText>
        Hola {name || "usuario"},
      </EmailText>

      <EmailText>
        Gracias por registrarte en BUKKAKERY. Para completar tu registro y acceder
        a todo nuestro contenido exclusivo, por favor verifica tu dirección de email
        haciendo clic en el botón de abajo.
      </EmailText>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={verificationUrl}>Verificar Email</EmailButton>
      </div>

      <EmailText>
        Este enlace expirará en 24 horas. Si no solicitaste este email,
        puedes ignorarlo de forma segura.
      </EmailText>

      <EmailText style={{ color: "#6b7280", fontSize: "14px" }}>
        Si el botón no funciona, copia y pega este enlace en tu navegador:
        <br />
        <span style={{ color: "#FA4860", wordBreak: "break-all" }}>
          {verificationUrl}
        </span>
      </EmailText>
    </BaseEmail>
  )
}
