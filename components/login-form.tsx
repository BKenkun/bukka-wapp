"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn, getSession } from "next-auth/react"
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

interface LoginFormProps extends React.ComponentProps<"form"> {
  showRegisterLink?: boolean
  showForgotPassword?: boolean
}

export function LoginForm({
  className,
  showRegisterLink = true,
  showForgotPassword = true,
  ...props
}: LoginFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email o contraseña incorrectos")
        setIsLoading(false)
        return
      }

      // Get session to check if user is admin
      const session = await getSession()

      if (session?.user?.isAdmin) {
        router.push("/admin")
      } else {
        router.push("/")
      }
      router.refresh()
    } catch {
      setError("Error al iniciar sesión")
      setIsLoading(false)
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Inicia sesión en tu cuenta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Introduce tu email y contraseña para acceder
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
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            {showForgotPassword && (
              <a
                href="#"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading}
            className="text-white placeholder:text-white/70"
          />
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
          {showRegisterLink && (
            <FieldDescription className="text-center">
              ¿No tienes cuenta?{" "}
              <a href="/registro" className="underline underline-offset-4 text-white hover:text-white">
                Regístrate
              </a>
            </FieldDescription>
          )}
        </Field>
      </FieldGroup>
    </form>
  )
}
