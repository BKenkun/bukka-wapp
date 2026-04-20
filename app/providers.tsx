"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { SubscriptionProvider } from "@/components/subscription-provider"
import { AuthModalProvider } from "@/components/auth/auth-modal-provider"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SubscriptionProvider>
        <AuthModalProvider>
          {children}
          <Toaster />
        </AuthModalProvider>
      </SubscriptionProvider>
    </SessionProvider>
  )
}
