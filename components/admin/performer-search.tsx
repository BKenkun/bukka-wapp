"use client"

import * as React from "react"
import { IconSearch, IconX, IconLoader2 } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Performer {
  id: string
  name: string
  slug: string
  profileImage?: string | null
}

interface PerformerSearchProps {
  performers: Performer[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function PerformerSearch({ performers, selectedIds, onChange }: PerformerSearchProps) {
  const [search, setSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedPerformers = performers.filter((p) => selectedIds.includes(p.id))

  const filteredPerformers = performers.filter(
    (p) =>
      !selectedIds.includes(p.id) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSelect = (id: string) => {
    onChange([...selectedIds, id])
    setSearch("")
    setIsOpen(false)
  }

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter((i) => i !== id))
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Search Input */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar actrices..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9"
        />

        {/* Dropdown Results */}
        {isOpen && search && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredPerformers.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No se encontraron resultados
              </div>
            ) : (
              filteredPerformers.map((performer) => (
                <button
                  key={performer.id}
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                  )}
                  onClick={() => handleSelect(performer.id)}
                >
                  {performer.profileImage ? (
                    <img
                      src={performer.profileImage}
                      alt={performer.name}
                      className="size-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {performer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{performer.name}</p>
                    <p className="text-xs text-muted-foreground">/{performer.slug}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Performers as Badges */}
      {selectedPerformers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPerformers.map((performer) => (
            <Badge
              key={performer.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1 flex items-center"
            >
              {performer.profileImage ? (
                <img
                  src={performer.profileImage}
                  alt={performer.name}
                  className="size-4 rounded-full object-cover mr-1"
                />
              ) : null}
              <span>{performer.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(performer.id)}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
              >
                <IconX className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Empty state */}
      {selectedPerformers.length === 0 && (
        <p className="text-sm text-muted-foreground">Ninguna actriz seleccionada</p>
      )}
    </div>
  )
}
