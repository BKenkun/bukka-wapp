import { TopBar } from "@/components/top-bar"
import { MainHeader } from "@/components/main-header"
import { Footer } from "@/components/footer"
import { ReferralBanner } from "@/components/referral-banner"
import { AgeVerificationProvider } from "@/components/age-verification-provider"
import { ThemeStylesProvider } from "@/components/theme-styles-provider"
import { StickyHeader } from "@/components/sticky-header"
import { DiscountBanner } from "@/components/discount-banner"
import { prisma } from "@/lib/prisma"

async function getThemeSettings(): Promise<Record<string, unknown> | undefined> {
  try {
    const themeSetting = await prisma.siteSettings.findUnique({
      where: { key: "design_theme" },
    })

    if (themeSetting?.value) {
      return themeSetting.value as Record<string, unknown>
    }

    // Backwards compat: check old key
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

interface WebLayoutProps {
  children: React.ReactNode
}

export default async function WebLayout({ children }: WebLayoutProps) {
  const initialTheme = await getThemeSettings()

  return (
    <AgeVerificationProvider>
      <ThemeStylesProvider initialTheme={initialTheme}>
        <StickyHeader
          topBar={<TopBar />}
          discountBanner={<DiscountBanner />}
        >
          <MainHeader />
        </StickyHeader>
        <ReferralBanner />
        {children}
        <Footer />
      </ThemeStylesProvider>
    </AgeVerificationProvider>
  )
}
