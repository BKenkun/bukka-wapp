import { Suspense } from "react"
import { auth } from "@/auth"
import { getHeaderMenu } from "@/lib/get-header-menu"
import { getGuestMenu } from "@/lib/get-guest-menu"
import { HeaderLogo } from "@/components/header/header-logo"
import { HeaderNav } from "@/components/header/header-nav"
import { HeaderActions } from "@/components/header/header-actions"
import { MobileMenu } from "@/components/header/mobile-menu"

function HeaderActionsFallback() {
  return (
    <div className="flex items-center gap-[11px]">
      <div className="w-5 h-5 rounded-full bg-zinc-400/40 animate-pulse" />
      <div className="w-5 h-5 rounded-full bg-zinc-400/40 animate-pulse" />
    </div>
  )
}

export async function MainHeader() {
  const session = await auth()
  const userTierLevel = session?.user?.SubscriptionPlan?.level ?? null
  const [links, guestMenu] = await Promise.all([
    getHeaderMenu({ userTierLevel }),
    getGuestMenu(),
  ])

  return (
    <header
      className="w-full px-4 md:px-8"
      style={{ paddingTop: "var(--header-padding-y, 24px)", paddingBottom: "var(--header-padding-y, 24px)" }}
    >
      <div className="grid grid-cols-12 items-center w-full max-w-[1400px] mx-auto gap-4">
        <div className="col-span-6 md:col-span-3 xl:col-span-2 flex justify-start items-center gap-3">
          <MobileMenu links={links} />
          <HeaderLogo />
        </div>

        <div className="hidden lg:flex lg:col-span-6 xl:col-span-8 justify-center">
          <HeaderNav links={links} />
        </div>

        <div className="col-span-6 md:col-span-3 xl:col-span-2 flex justify-end">
          <Suspense fallback={<HeaderActionsFallback />}>
            <HeaderActions guestMenu={guestMenu} />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
