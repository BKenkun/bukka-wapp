"use client"

import * as React from "react"
import { AgeVerificationModal } from "./age-verification-modal"

interface AgeVerificationSettings {
  enabled: boolean
  title: string
  description: string
  enterButtonText: string
  exitButtonText: string
  exitUrl: string
}

const DEFAULT_SETTINGS: AgeVerificationSettings = {
  enabled: true,
  title: "Este es un Sitio Web para adultos",
  description: "Este sitio web contiene material restringido a menores de edad, que incluye desnudez y representaciones explícitas de actividad sexual. Al entrar, afirma que tiene por lo menos 18 años de edad o la mayoría de edad en la jurisdicción desde que está accediendo el sitio web y que da consentimiento en ver contenido sexualmente explícito.",
  enterButtonText: "Tengo 18 años o más - Entrar",
  exitButtonText: "Soy menor de 18 años - Salir",
  exitUrl: "https://www.google.com",
}

export function AgeVerificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [settings, setSettings] = React.useState<AgeVerificationSettings | null>(null)

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/age-verification")
        if (response.ok) {
          const data = await response.json()
          setSettings({ ...DEFAULT_SETTINGS, ...data })
        } else {
          setSettings(DEFAULT_SETTINGS)
        }
      } catch {
        setSettings(DEFAULT_SETTINGS)
      }
    }

    fetchSettings()
  }, [])

  return (
    <>
      {children}
      {settings && (
        <AgeVerificationModal
          enabled={settings.enabled}
          title={settings.title}
          description={settings.description}
          enterButtonText={settings.enterButtonText}
          exitButtonText={settings.exitButtonText}
          exitUrl={settings.exitUrl}
        />
      )}
    </>
  )
}
