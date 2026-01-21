"use client"

import * as React from "react"

interface ButtonSettings {
  backgroundColor: string
  textColor: string
  borderRadius: string
  fontSize: string
  fontWeight: string
  padding: string
  hoverBackgroundColor: string
  hoverTextColor: string
  borderColor?: string
  borderWidth?: string
}

interface DesignSettings {
  primary: ButtonSettings
  secondary: ButtonSettings
}

const defaultSettings: DesignSettings = {
  primary: {
    backgroundColor: "#FA4860",
    textColor: "#FFFFFF",
    borderRadius: "0",
    fontSize: "16",
    fontWeight: "500",
    padding: "10px 28px",
    hoverBackgroundColor: "#E03E54",
    hoverTextColor: "#FFFFFF",
  },
  secondary: {
    backgroundColor: "transparent",
    textColor: "#FA4860",
    borderRadius: "0",
    fontSize: "16",
    fontWeight: "500",
    padding: "10px 28px",
    borderColor: "#FA4860",
    borderWidth: "2",
    hoverBackgroundColor: "#FA4860",
    hoverTextColor: "#FFFFFF",
  },
}

export function ButtonStylesProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<DesignSettings>(defaultSettings)

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings/design")
        if (response.ok) {
          const data = await response.json()
          if (data.buttons) {
            setSettings({
              primary: { ...defaultSettings.primary, ...data.buttons.primary },
              secondary: { ...defaultSettings.secondary, ...data.buttons.secondary },
            })
          }
        }
      } catch (error) {
        console.error("Error loading button styles:", error)
      }
    }

    loadSettings()
  }, [])

  // Generate CSS variables and inject as style tag
  const cssVariables = React.useMemo(() => {
    const p = settings.primary
    const s = settings.secondary

    return `
      :root {
        /* Primary Button */
        --btn-primary-bg: ${p.backgroundColor};
        --btn-primary-text: ${p.textColor};
        --btn-primary-radius: ${p.borderRadius}px;
        --btn-primary-font-size: ${p.fontSize}px;
        --btn-primary-font-weight: ${p.fontWeight};
        --btn-primary-padding: ${p.padding};
        --btn-primary-hover-bg: ${p.hoverBackgroundColor};
        --btn-primary-hover-text: ${p.hoverTextColor};

        /* Secondary Button */
        --btn-secondary-bg: ${s.backgroundColor};
        --btn-secondary-text: ${s.textColor};
        --btn-secondary-radius: ${s.borderRadius}px;
        --btn-secondary-font-size: ${s.fontSize}px;
        --btn-secondary-font-weight: ${s.fontWeight};
        --btn-secondary-padding: ${s.padding};
        --btn-secondary-border-color: ${s.borderColor || "#FA4860"};
        --btn-secondary-border-width: ${s.borderWidth || "2"}px;
        --btn-secondary-hover-bg: ${s.hoverBackgroundColor};
        --btn-secondary-hover-text: ${s.hoverTextColor};
      }

      /* Global button styles */
      .btn-primary {
        background-color: var(--btn-primary-bg) !important;
        color: var(--btn-primary-text) !important;
        border-radius: var(--btn-primary-radius) !important;
        font-size: var(--btn-primary-font-size) !important;
        font-weight: var(--btn-primary-font-weight) !important;
        padding: var(--btn-primary-padding) !important;
        font-family: 'Montserrat', sans-serif !important;
        border: none !important;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-primary:hover:not(:disabled) {
        background-color: var(--btn-primary-hover-bg) !important;
        color: var(--btn-primary-hover-text) !important;
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-secondary {
        background-color: var(--btn-secondary-bg) !important;
        color: var(--btn-secondary-text) !important;
        border-radius: var(--btn-secondary-radius) !important;
        font-size: var(--btn-secondary-font-size) !important;
        font-weight: var(--btn-secondary-font-weight) !important;
        padding: var(--btn-secondary-padding) !important;
        font-family: 'Montserrat', sans-serif !important;
        border: var(--btn-secondary-border-width) solid var(--btn-secondary-border-color) !important;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-secondary:hover:not(:disabled) {
        background-color: var(--btn-secondary-hover-bg) !important;
        color: var(--btn-secondary-hover-text) !important;
      }

      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `
  }, [settings])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      {children}
    </>
  )
}
