"use client"

import { useState } from "react"
import Link from "next/link"
import { IconMenu2, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { NavItemWithMegamenu } from "@/types/megamenu"

interface MobileMenuProps {
  links: NavItemWithMegamenu[]
}

export function MobileMenu({ links }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:opacity-80"
          style={{ color: "var(--header-nav-text)" }}
        >
          <IconMenu2 className="size-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] p-0"
        style={{ backgroundColor: "var(--global-bg)", borderColor: "var(--footer-border-color)" }}
      >
        <SheetHeader className="p-4 border-b" style={{ borderColor: "var(--footer-border-color)" }}>
          <SheetTitle className="text-left" style={{ color: "var(--text-primary)" }}>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col py-4">
          {links.map((link, index) => (
            <Link
              key={link.id || index}
              href={link.url}
              target={link.openInNewTab ? "_blank" : undefined}
              rel={link.openInNewTab ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="px-4 py-3 hover:opacity-80 transition-colors"
              style={{
                color: link.highlight && link.highlightColor ? link.highlightColor : "var(--header-nav-text)",
                fontWeight: "var(--header-nav-font-weight)" as React.CSSProperties["fontWeight"],
                fontFamily: "var(--global-font)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
