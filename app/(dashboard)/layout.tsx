import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { TopBar } from "@/components/top-bar"
import { MainHeader } from "@/components/main-header"
import { Footer } from "@/components/footer"
import { StickyHeader } from "@/components/sticky-header"
import { DiscountBanner } from "@/components/discount-banner"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <>
      <StickyHeader topBar={<TopBar />} discountBanner={<DiscountBanner />}>
        <MainHeader />
      </StickyHeader>
      {children}
      <Footer />
    </>
  )
}
