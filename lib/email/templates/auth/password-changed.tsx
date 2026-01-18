import * as React from "react"
import { BaseEmail, EmailHeading, EmailText, EmailInfoBox } from "../base"

interface PasswordChangedEmailProps {
  name: string
  changedAt: Date
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function PasswordChangedEmailTemplate({ name, changedAt }: PasswordChangedEmailProps) {
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(changedAt)

  return (
    <BaseEmail preview="Tu contraseña ha sido actualizada correctamente">
      <EmailHeading>Contraseña actualizada</EmailHeading>

      <EmailText>
        Hola {name || "usuario"},
      </EmailText>

      <EmailText>
        Te confirmamos que tu contraseña ha sido actualizada correctamente el{" "}
        <strong>{formattedDate}</strong>.
      </EmailText>

      <EmailInfoBox variant="success">
        <EmailText style={{ margin: 0, fontSize: "14px" }}>
          Tu cuenta está segura. Ya puedes iniciar sesión con tu nueva contraseña.
        </EmailText>
      </EmailInfoBox>

      <EmailText>
        Si no realizaste este cambio, por favor contacta inmediatamente con
        nuestro equipo de soporte o solicita un nuevo restablecimiento de
        contraseña.
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
          Restablecer contraseña si no fui yo
        </a>
      </div>

      <EmailText>
        Por tu seguridad, te recomendamos:
      </EmailText>

      <ul style={{ color: "#374151", fontSize: "14px", lineHeight: "24px" }}>
        <li>Usar contraseñas únicas para cada servicio</li>
        <li>No compartir tu contraseña con nadie</li>
        <li>Cerrar sesión en dispositivos públicos</li>
      </ul>

      <EmailText>
        Atentamente,
        <br />
        El equipo de BUKKAKERY
      </EmailText>
    </BaseEmail>
  )
}
