import Link from "next/link"
import type { MegamenuLinkResolved } from "@/types/megamenu"

interface MegamenuLinkItemProps {
  link: MegamenuLinkResolved
}

export function MegamenuLinkItem({ link }: MegamenuLinkItemProps) {
  return (
    <Link
      href={link.url}
      target={link.openInNewTab ? "_blank" : undefined}
      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
      className="block py-1.5 text-sm hover:opacity-80 transition-colors"
      style={{ color: "var(--text-muted)" }}
    >
      {link.label}
    </Link>
  )
}
