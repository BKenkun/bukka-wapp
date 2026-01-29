"use client"

import { useState } from "react"
import Link from "next/link"
import type { MegamenuPerformer } from "@/types/megamenu"

interface MegamenuPerformerCardProps {
  performer: MegamenuPerformer
}

export function MegamenuPerformerCard({ performer }: MegamenuPerformerCardProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <Link
      href={`/modelos/${performer.slug}`}
      className="group block cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Vertical image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-800">
        {performer.profileImage ? (
          <img
            src={performer.profileImage}
            alt={performer.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-zinc-500">
              {performer.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Hover overlay with "Ver" button */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
          <span className="px-4 py-2 bg-[#FA4860] text-white text-sm font-bold uppercase tracking-wide">
            Ver
          </span>
        </div>
      </div>

      {/* Name below */}
      <div className="mt-2 text-center">
        <span className="text-white text-sm font-medium group-hover:text-[#FA4860] transition-colors">
          {performer.name}
        </span>
      </div>
    </Link>
  )
}
