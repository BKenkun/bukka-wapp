"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { LoginModal } from "@/components/auth/login-modal"

export type AuthModalView = "login" | "register" | "forgot-password"

interface OpenAuthModalOptions {
  view?: AuthModalView
  callbackUrl?: string | null
}

interface AuthModalContextValue {
  isOpen: boolean
  view: AuthModalView
  openAuthModal: (options?: OpenAuthModalOptions) => void
  closeAuthModal: () => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<AuthModalView>("login")
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null)

  const openAuthModal = useCallback((options: OpenAuthModalOptions = {}) => {
    setView(options.view ?? "login")
    setCallbackUrl(options.callbackUrl ?? null)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
    setCallbackUrl(null)
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) setCallbackUrl(null)
  }, [])

  return (
    <AuthModalContext.Provider value={{ isOpen, view, openAuthModal, closeAuthModal }}>
      {children}
      <LoginModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        defaultView={view}
        callbackUrl={callbackUrl}
      />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) {
    throw new Error("useAuthModal debe usarse dentro de <AuthModalProvider>")
  }
  return ctx
}
