"use client"

import * as React from "react"
import { AgeVerificationModal } from "./age-verification-modal"

interface AgeVerificationSettings {
  enabled: boolean
  okysafeEnabled: boolean
  title: string
  description: string
  exitButtonText: string
  exitUrl: string
}

const DEFAULT_SETTINGS: AgeVerificationSettings = {
  enabled: true,
  okysafeEnabled: true,
  title: "This is an Adult Website",
  description: "This website contains age-restricted material, including nudity and explicit depictions of sexual activity. By entering, you affirm that you are at least 18 years of age or the age of majority in the jurisdiction from which you are accessing the website, and that you consent to viewing sexually explicit content.",
  exitButtonText: "I am under 18 - Exit",
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
          okysafeEnabled={settings.okysafeEnabled}
          title={settings.title}
          description={settings.description}
          exitButtonText={settings.exitButtonText}
          exitUrl={settings.exitUrl}
        />
      )}
    </>
  )
}
