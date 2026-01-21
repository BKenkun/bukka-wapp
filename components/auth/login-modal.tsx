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
import { Loader2 } from "lucide-react"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email o contraseña incorrectos")
        setIsLoading(false)
        return
      }

      onOpenChange(false)
      router.refresh()
    } catch {
      setError("Error al iniciar sesión")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-black border-zinc-800 p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-white text-xl font-bold text-center">
            Iniciar Sesión
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#FA4860] focus:ring-[#FA4860]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white text-sm">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#FA4860] focus:ring-[#FA4860]"
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
            <a
              href="/recuperar-password"
              className="text-zinc-400 text-sm hover:text-white transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-2 text-zinc-500">o</span>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-zinc-400">¿No tienes cuenta? </span>
            <a
              href="/registro"
              className="text-[#FA4860] hover:underline font-medium"
            >
              Regístrate
            </a>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
