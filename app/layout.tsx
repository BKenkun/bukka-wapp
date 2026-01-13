import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "./providers"
import { getSeoMetadata } from "@/lib/get-site-settings"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata()

  return {
    title: {
      default: seo.title,
      template: `%s | ${seo.siteName}`,
    },
    description: seo.description,
    icons: seo.favicon
      ? {
          icon: seo.favicon,
          apple: seo.favicon,
        }
      : {
          icon: [
            {
              url: "/icon-light-32x32.png",
              media: "(prefers-color-scheme: light)",
            },
            {
              url: "/icon-dark-32x32.png",
              media: "(prefers-color-scheme: dark)",
            },
            {
              url: "/icon.svg",
              type: "image/svg+xml",
            },
          ],
          apple: "/apple-icon.png",
        },
    openGraph: {
      title: seo.title,
      description: seo.description,
      siteName: seo.siteName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} font-sans antialiased bg-black text-white`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
