import type React from "react"
import Link from "next/link"

interface InteractionCardProps {
  title: string
  count: string
  icon: React.ReactNode
  href?: string
}

export function InteractionCard({ title, count, icon, href }: InteractionCardProps) {
  const content = (
    <div className={`flex-1 flex items-center justify-between p-6 gap-4 ${href ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`} style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)" }}>
      <div className="flex flex-col gap-2">
        <p className="font-montserrat text-[20.956px] font-semibold leading-[29.937px]" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="font-inter text-[35.925px] font-bold leading-[47.9px]" style={{ color: "var(--text-primary)" }}>{count}</p>
      </div>
      <div className="flex-shrink-0">{icon}</div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="flex-1">
        {content}
      </Link>
    )
  }

  return content
}
