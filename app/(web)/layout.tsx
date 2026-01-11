import { TopBar } from "@/components/top-bar"
import { MainHeader } from "@/components/main-header"
import { Footer } from "@/components/footer"
import { AgeVerificationProvider } from "@/components/age-verification-provider"

interface WebLayoutProps {
  children: React.ReactNode
}

export default async function WebLayout({ children }: WebLayoutProps) {
  return (
    <AgeVerificationProvider>
      <TopBar />
      <MainHeader />
      {children}
      <Footer />
    </AgeVerificationProvider>
  )
}
