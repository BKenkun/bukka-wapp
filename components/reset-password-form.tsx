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
          <h1 className="text-2xl font-bold">Invalid link</h1>
          <p className="text-muted-foreground text-sm text-balance">
            The reset link is invalid or has expired.
            Please request a new one.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <a href="/forgot-password">
            <Button className="w-full">Request New Link</Button>
          </a>
          <a
            href="/?login=true"
            className="text-sm text-center underline underline-offset-4 text-white hover:text-white/80"
          >
            Back to log in
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
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
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
        setError(data.error || "Error resetting password")
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
    } catch {
      setError("Error resetting password")
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
          <h1 className="text-2xl font-bold">Password updated</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Your password has been reset successfully.
            You can now log in with your new password.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <a href="/?login=true">
            <Button className="w-full">Log In</Button>
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
          <h1 className="text-2xl font-bold">New password</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your new password
          </p>
        </div>

        {error && (
          <FieldError>{error}</FieldError>
        )}

        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Minimum 6 characters"
            required
            disabled={isLoading}
            className="text-white placeholder:text-white/70"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            required
            disabled={isLoading}
            className="text-white placeholder:text-white/70"
          />
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Password"}
          </Button>
          <FieldDescription className="text-center">
            Remembered your password?{" "}
            <a href="/?login=true" className="underline underline-offset-4 text-white hover:text-white">
              Log In
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
