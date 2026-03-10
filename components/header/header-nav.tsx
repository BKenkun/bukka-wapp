"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import type { NavItemWithMegamenu } from "@/types/megamenu"
import { Megamenu } from "./megamenu"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  openInNewTab?: boolean
  highlight?: boolean
  highlightColor?: string | null
}

interface HeaderNavProps {
  links: NavItemWithMegamenu[]
}

function NavLink({ href, children, openInNewTab, highlight, highlightColor }: NavLinkProps) {
  return (
    <Link
      href={href}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      className="text-sm xl:text-base leading-6 hover:opacity-80 transition-opacity whitespace-nowrap"
      style={{
        color: highlight && highlightColor ? highlightColor : "var(--header-nav-text)",
        fontSize: "var(--header-nav-font-size)",
        fontWeight: "var(--header-nav-font-weight)" as React.CSSProperties["fontWeight"],
        fontFamily: "var(--global-font)",
      }}
    >
      {children}
    </Link>
  )
}

export function HeaderNav({ links }: HeaderNavProps) {
  const [openMegamenu, setOpenMegamenu] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const megamenuLink = openMegamenu
    ? links.find((link, index) => (link.id || String(index)) === openMegamenu)
    : null

  const handleMouseEnter = (key: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setOpenMegamenu(key)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenMegamenu(null)
    }, 150)
  }

  const handleMegamenuEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  return (
    <>
      <nav className="flex items-center justify-center w-full">
        <div className="flex items-center gap-[45px] flex-wrap justify-center">
          {links.map((link, index) => {
            const key = link.id || String(index)

            if (link.hasMegamenu && link.megamenu) {
              return (
                <Link
                  key={key}
                  href={link.url}
                  target={link.openInNewTab ? "_blank" : undefined}
                  rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                  onMouseEnter={() => handleMouseEnter(key)}
                  onMouseLeave={handleMouseLeave}
                  className="text-sm xl:text-base leading-6 hover:opacity-80 transition-opacity whitespace-nowrap flex items-center gap-1"
                  style={{
                    color: link.highlight && link.highlightColor ? link.highlightColor : "var(--header-nav-text)",
                    fontSize: "var(--header-nav-font-size)",
                    fontWeight: "var(--header-nav-font-weight)" as React.CSSProperties["fontWeight"],
                    fontFamily: "var(--global-font)",
                  }}
                >
                  {link.label}
                  <svg
                    className={`w-3 h-3 transition-transform ${openMegamenu === key ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
              )
            }

            return (
              <NavLink
                key={key}
                href={link.url}
                openInNewTab={link.openInNewTab}
                highlight={link.highlight}
                highlightColor={link.highlightColor}
              >
                {link.label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Megamenu dropdown - centered, compact */}
      {megamenuLink?.megamenu && (
        <div
          className="fixed left-0 right-0 top-[72px] z-50 flex justify-center"
          onMouseEnter={handleMegamenuEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="w-full shadow-lg border-b"
            style={{
              backgroundColor: "var(--global-bg)",
              borderColor: "var(--text-muted, rgba(255,255,255,0.1))",
            }}
          >
            <div className="max-w-[1400px] mx-auto">
              <Megamenu data={megamenuLink.megamenu} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
