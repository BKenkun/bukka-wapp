"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { IconCheck, IconAlertCircle } from "@tabler/icons-react"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Si no hay token, mostrar error
  if (!token) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-red-500/20 flex items-center justify-center">
            <IconAlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold">Enlace inválido</h1>
          <p className="text-muted-foreground text-sm text-balance">
            El enlace de recuperación no es válido o ha expirado.
            Por favor, solicita uno nuevo.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <a href="/forgot-password">
            <Button className="w-full">Solicitar nuevo enlace</Button>
          </a>
          <a
            href="/?login=true"
            className="text-sm text-center underline underline-offset-4 text-white hover:text-white/80"
          >
            Volver a iniciar sesión
          </a>
        </div>
      </div>
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al restablecer la contraseña")
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
    } catch {
      setError("Error al restablecer la contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-green-500/20 flex items-center justify-center">
            <IconCheck className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">Contraseña actualizada</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Tu contraseña ha sido restablecida correctamente.
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <a href="/?login=true">
            <Button className="w-full">Iniciar sesión</Button>
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
          <h1 className="text-2xl font-bold">Nueva contraseña</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Introduce tu nueva contraseña
          </p>
        </div>

        {error && (
          <FieldError>{error}</FieldError>
        )}

        <Field>
          <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
            disabled={isLoading}
            className="text-white placeholder:text-white/70"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repite tu contraseña"
            required
            disabled={isLoading}
            className="text-white placeholder:text-white/70"
          />
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar contraseña"}
          </Button>
          <FieldDescription className="text-center">
            ¿Recordaste tu contraseña?{" "}
            <a href="/?login=true" className="underline underline-offset-4 text-white hover:text-white">
              Inicia sesión
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
