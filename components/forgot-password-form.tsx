"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { IconCheck, IconMail } from "@tabler/icons-react"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [email, setEmail] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const emailValue = formData.get("email") as string
    setEmail(emailValue)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailValue }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al procesar la solicitud")
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
    } catch {
      setError("Error al procesar la solicitud")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <IconMail className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">Revisa tu email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Si existe una cuenta con el email <strong className="text-white">{email}</strong>,
            recibirás un enlace para restablecer tu contraseña.
          </p>
          <p className="text-muted-foreground text-xs">
            El enlace expirará en 1 hora.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <a
            href="/login"
            className="text-sm text-center underline underline-offset-4 text-white hover:text-white/80"
          >
            Volver a iniciar sesión
          </a>
        </div>
      </div>
    )
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {error && (
          <FieldError>{error}</FieldError>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            disabled={isLoading}
            className="text-white placeholder:text-white/70"
          />
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar enlace"}
          </Button>
          <FieldDescription className="text-center">
            ¿Recordaste tu contraseña?{" "}
            <a href="/login" className="underline underline-offset-4 text-white hover:text-white">
              Inicia sesión
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
