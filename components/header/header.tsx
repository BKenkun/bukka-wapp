"use client"

import { HeaderLogo } from "./header-logo"
import { HeaderNav } from "./header-nav"
import { HeaderActions } from "./header-actions"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]">
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
          <HeaderActions />
        </div>
      </div>
    </header>
  )
}
