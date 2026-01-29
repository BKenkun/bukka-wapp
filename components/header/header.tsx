"use client"

import { Suspense } from "react"
import { HeaderLogo } from "./header-logo"
import { HeaderNav } from "./header-nav"
import { HeaderActions } from "./header-actions"

function HeaderActionsFallback() {
  return (
    <div className="flex items-center gap-[11px]">
      <div className="w-5 h-5 rounded-full bg-zinc-400/40 animate-pulse" />
      <div className="w-5 h-5 rounded-full bg-zinc-400/40 animate-pulse" />
    </div>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-black">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <HeaderLogo />
        </div>

        {/* Navigation - Hidden on mobile */}
        <div className="hidden lg:flex flex-1 justify-center">
          <HeaderNav />
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <Suspense fallback={<HeaderActionsFallback />}>
            <HeaderActions />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
