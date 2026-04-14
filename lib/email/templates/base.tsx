import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface BaseEmailProps {
  preview: string
  children: React.ReactNode
  logoUrl?: string | null
  primaryColor?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export function BaseEmail({
  preview,
  children,
  logoUrl,
  primaryColor = "#FA4860",
}: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                width="180"
                height="50"
                alt="BUKKAKERY"
                style={logo}
              />
            ) : (
              <Text style={{ ...logoText, color: primaryColor }}>BUKKAKERY</Text>
            )}
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by BUKKAKERY.
              <br />
              If you did not request this email, you can safely ignore it.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${APP_URL}/paginas/privacidad`} style={footerLink}>
                Privacy
              </Link>
              {" | "}
              <Link href={`${APP_URL}/paginas/terminos`} style={footerLink}>
                Terms
              </Link>
              {" | "}
              <Link href={`${APP_URL}/contact`} style={footerLink}>
                Contact
              </Link>
            </Text>
            <Text style={copyright}>
              © {new Date().getFullYear()} BUKKAKERY. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Button component for emails
export function EmailButton({
  href,
  children,
  primaryColor = "#FA4860",
}: {
  href: string
  children: React.ReactNode
  primaryColor?: string
}) {
  return (
    <Link
      href={href}
      style={{
        ...button,
        backgroundColor: primaryColor,
      }}
    >
      {children}
    </Link>
  )
}

// Heading component
export function EmailHeading({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return <Text style={{ ...heading, ...style }}>{children}</Text>
}

// Paragraph component
export function EmailText({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return <Text style={{ ...text, ...style }}>{children}</Text>
}

// Info box component
export function EmailInfoBox({
  children,
  variant = "info",
}: {
  children: React.ReactNode
  variant?: "info" | "success" | "warning" | "error"
}) {
  const colors = {
    info: { bg: "#f0f9ff", border: "#0ea5e9" },
    success: { bg: "#f0fdf4", border: "#22c55e" },
    warning: { bg: "#fefce8", border: "#eab308" },
    error: { bg: "#fef2f2", border: "#ef4444" },
  }

  return (
    <Section
      style={{
        ...infoBox,
        backgroundColor: colors[variant].bg,
        borderLeftColor: colors[variant].border,
      }}
    >
      {children}
    </Section>
  )
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
}

const header = {
  backgroundColor: "#000000",
  padding: "24px 40px",
  textAlign: "center" as const,
}

const logo = {
  margin: "0 auto",
}

const logoText = {
  fontSize: "28px",
  fontWeight: "800",
  letterSpacing: "4px",
  margin: "0",
}

const content = {
  padding: "40px",
}

const footer = {
  backgroundColor: "#f6f9fc",
  padding: "24px 40px",
  textAlign: "center" as const,
}

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0 0 16px",
}

const footerLinks = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0 0 16px",
}

const footerLink = {
  color: "#6b7280",
  textDecoration: "underline",
}

const copyright = {
  color: "#9ca3af",
  fontSize: "11px",
  margin: "0",
}

const heading = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "32px",
  margin: "0 0 24px",
}

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
}

const button = {
  backgroundColor: "#FA4860",
  borderRadius: "4px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "1",
  padding: "16px 32px",
  textDecoration: "none",
  textAlign: "center" as const,
}

const infoBox = {
  padding: "16px 20px",
  borderRadius: "4px",
  borderLeft: "4px solid",
  margin: "16px 0",
}
