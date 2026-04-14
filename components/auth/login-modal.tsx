"use client"

import * as React from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: "login" | "register" | "forgot-password"
  callbackUrl?: string | null
}

type ModalView = "login" | "register" | "forgot-password" | "forgot-password-success"

const inputStyles = "rounded-none"
const inputStyle = {
  backgroundColor: "var(--form-input-bg)",
  borderColor: "var(--form-input-border)",
  color: "var(--form-input-text)",
}

export function LoginModal({ open, onOpenChange, defaultView = "login", callbackUrl }: LoginModalProps) {
  const router = useRouter()
  const [view, setView] = useState<ModalView>(defaultView)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  React.useEffect(() => {
    if (open) {
      setView(defaultView)
      setError("")
      setSuccess("")
      setForgotPasswordEmail("")
    }
  }, [open, defaultView])

  React.useEffect(() => {
    setError("")
    setSuccess("")
  }, [view])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email o contraseña incorrectos")
        setIsLoading(false)
        return
      }

      onOpenChange(false)
      if (callbackUrl) {
        router.push(callbackUrl)
      } else {
        router.refresh()
      }
    } catch {
      setError("Error al iniciar sesión")
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (registerData.password !== registerData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al crear la cuenta")
        setIsLoading(false)
        return
      }

      setSuccess("¡Cuenta creada! Revisa tu email para verificarla.")
      setRegisterData({ name: "", email: "", password: "", confirmPassword: "" })
      setIsLoading(false)

      setTimeout(() => {
        setView("login")
        setSuccess("")
      }, 3000)
    } catch {
      setError("Error al crear la cuenta")
      setIsLoading(false)
    }
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al procesar la solicitud")
        setIsLoading(false)
        return
      }

      setView("forgot-password-success")
      setIsLoading(false)
    } catch {
      setError("Error al procesar la solicitud")
      setIsLoading(false)
    }
  }

  const getTitle = () => {
    switch (view) {
      case "login":
        return "Iniciar Sesión"
      case "register":
        return "Crear Cuenta"
      case "forgot-password":
        return "Recuperar Contraseña"
      case "forgot-password-success":
        return "Email Enviado"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[400px] p-0 gap-0 rounded-none"
        style={{ backgroundColor: "var(--global-bg)", borderColor: "var(--border-color)" }}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-center" style={{ color: "var(--text-primary)" }}>
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        {(view === "login" || view === "register") && (
          <div className="flex mx-6 mt-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <button
              type="button"
              onClick={() => setView("login")}
              className="flex-1 pb-3 text-sm font-medium transition-colors cursor-pointer"
              style={{
                color: view === "login" ? "var(--accent-color)" : "var(--text-muted)",
                borderBottom: view === "login" ? "2px solid var(--accent-color)" : "2px solid transparent",
              }}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setView("register")}
              className="flex-1 pb-3 text-sm font-medium transition-colors cursor-pointer"
              style={{
                color: view === "register" ? "var(--accent-color)" : "var(--text-muted)",
                borderBottom: view === "register" ? "2px solid var(--accent-color)" : "2px solid transparent",
              }}
            >
              Registrarse
            </button>
          </div>
        )}

        {view === "login" && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm" style={{ color: "var(--text-primary)" }}>
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="tu@email.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
                disabled={isLoading}
                className={inputStyles}
                style={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm" style={{ color: "var(--text-primary)" }}>
                Contraseña
              </Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                disabled={isLoading}
                className={inputStyles}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setView("forgot-password")}
                className="text-sm transition-colors cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        )}

        {view === "register" && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="register-name" className="text-sm" style={{ color: "var(--text-primary)" }}>
                Nombre
              </Label>
              <Input
                id="register-name"
                type="text"
                placeholder="Tu nombre"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                required
                disabled={isLoading}
                className={inputStyles}
                style={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email" className="text-sm" style={{ color: "var(--text-primary)" }}>
                Email
              </Label>
              <Input
                id="register-email"
                type="email"
                placeholder="tu@email.com"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                required
                disabled={isLoading}
                className={inputStyles}
                style={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password" className="text-sm" style={{ color: "var(--text-primary)" }}>
                Contraseña
              </Label>
              <Input
                id="register-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                required
                disabled={isLoading}
                className={inputStyles}
                style={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm" className="text-sm" style={{ color: "var(--text-primary)" }}>
                Confirmar Contraseña
              </Label>
              <Input
                id="register-confirm"
                type="password"
                placeholder="Repite tu contraseña"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                required
                disabled={isLoading}
                className={inputStyles}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </form>
        )}

        {view === "forgot-password" && (
          <div className="p-6 space-y-5">
            <button
              type="button"
              onClick={() => setView("login")}
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
              Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-sm" style={{ color: "var(--text-primary)" }}>
                  Email
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className={inputStyles}
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  "Enviar enlace"
                )}
              </button>
            </form>
          </div>
        )}

        {view === "forgot-password-success" && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-green-500/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  Hemos enviado un enlace a
                </p>
                <p className="font-medium" style={{ color: "var(--accent-color)" }}>
                  {forgotPasswordEmail}
                </p>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Si existe una cuenta con ese email, recibirás instrucciones para restablecer tu contraseña.
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                El enlace expirará en 1 hora.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setView("login")}
              className="w-full btn-primary"
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
