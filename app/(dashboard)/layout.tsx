import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { TopBar } from "@/components/top-bar"
import { MainHeader } from "@/components/main-header"
import { Footer } from "@/components/footer"
import { StickyHeader } from "@/components/sticky-header"
import { DiscountBanner } from "@/components/discount-banner"
import { ThemeStylesProvider } from "@/components/theme-styles-provider"
import { prisma } from "@/lib/prisma"

async function getThemeSettings(): Promise<Record<string, unknown> | undefined> {
  try {
    const themeSetting = await prisma.siteSettings.findUnique({
      where: { key: "design_theme" },
    })

    if (themeSetting?.value) {
      return themeSetting.value as Record<string, unknown>
    }

    const buttonsSetting = await prisma.siteSettings.findUnique({
      where: { key: "design_buttons" },
    })

    if (buttonsSetting?.value) {
      return { buttons: buttonsSetting.value } as Record<string, unknown>
    }
  } catch (error) {
    console.error("Error loading theme settings:", error)
  }
  return undefined
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const initialTheme = await getThemeSettings()

  return (
    <ThemeStylesProvider initialTheme={initialTheme}>
      <StickyHeader topBar={<TopBar />} discountBanner={<DiscountBanner />}>
        <MainHeader />
      </StickyHeader>
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        {children}
      </div>
      <Footer />
    </ThemeStylesProvider>
  )
}
