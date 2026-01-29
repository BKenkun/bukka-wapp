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
          className="lg:hidden text-white hover:bg-zinc-800"
        >
          <IconMenu2 className="size-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] bg-black border-zinc-800 p-0"
      >
        <SheetHeader className="p-4 border-b border-zinc-800">
          <SheetTitle className="text-white text-left">Menú</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col py-4">
          {links.map((link, index) => (
            <Link
              key={link.id || index}
              href={link.url}
              target={link.openInNewTab ? "_blank" : undefined}
              rel={link.openInNewTab ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-white font-bold font-['Montserrat'] hover:bg-zinc-800 transition-colors"
              style={link.highlight && link.highlightColor ? { color: link.highlightColor } : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
