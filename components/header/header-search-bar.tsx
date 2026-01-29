"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { SearchModal } from "@/components/search/search-modal"

export function HeaderSearchBar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <div className="w-full px-4 md:px-8 py-2 bg-black/50">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full max-w-3xl mx-auto flex h-10 bg-zinc-800/80 hover:bg-zinc-800 items-center px-4 cursor-pointer transition-colors rounded"
        >
          <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-3" />
          <span className="text-zinc-400 font-['Montserrat'] text-sm">Buscar en Bukkakery</span>
        </button>
      </div>

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  )
}
