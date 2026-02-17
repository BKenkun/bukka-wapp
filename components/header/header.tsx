import { Suspense } from "react"
import { auth } from "@/auth"
import { getHeaderMenu } from "@/lib/get-header-menu"
import { getGuestMenu } from "@/lib/get-guest-menu"
import { HeaderLogo } from "./header-logo"
import { HeaderNav } from "./header-nav"
import { HeaderActions } from "./header-actions"
import { MobileMenu } from "./mobile-menu"

function HeaderActionsFallback() {
  return (
    <div className="flex items-center gap-[11px]">
      <div className="w-5 h-5 rounded-full bg-zinc-400/40 animate-pulse" />
      <div className="w-5 h-5 rounded-full bg-zinc-400/40 animate-pulse" />
    </div>
  )
}

export async function Header() {
  const session = await auth()
  const userTierLevel = session?.user?.SubscriptionPlan?.level ?? null
  const [links, guestMenu] = await Promise.all([
    getHeaderMenu({ userTierLevel }),
    getGuestMenu(),
  ])

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: "var(--global-bg)" }}>
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {/* Mobile Menu + Logo */}
        <div className="flex items-center gap-3">
          <MobileMenu links={links} />
          <HeaderLogo />
        </div>

        {/* Navigation - Hidden on mobile */}
        <div className="hidden lg:flex flex-1 justify-center">
          <HeaderNav links={links} />
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <Suspense fallback={<HeaderActionsFallback />}>
            <HeaderActions guestMenu={guestMenu} />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
