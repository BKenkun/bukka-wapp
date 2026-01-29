import { TopBar } from "@/components/top-bar"
import { MainHeader } from "@/components/main-header"
import { Footer } from "@/components/footer"
import { AgeVerificationProvider } from "@/components/age-verification-provider"
import { ButtonStylesProvider } from "@/components/button-styles-provider"
import { StickyHeader } from "@/components/sticky-header"
import { DiscountBanner } from "@/components/discount-banner"

interface WebLayoutProps {
  children: React.ReactNode
}

export default async function WebLayout({ children }: WebLayoutProps) {
  return (
    <AgeVerificationProvider>
      <ButtonStylesProvider>
        <StickyHeader topBar={<TopBar />} discountBanner={<DiscountBanner />}>
          <MainHeader />
        </StickyHeader>
        {children}
        <Footer />
      </ButtonStylesProvider>
    </AgeVerificationProvider>
  )
}
