"use client"

import * as React from "react"
import { IconSearch, IconX } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  slug: string
  images?: string[]
}

interface ProductSearchProps {
  products: Product[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function ProductSearch({ products, selectedIds, onChange }: ProductSearchProps) {
  const [search, setSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id))

  const filteredProducts = products.filter(
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
          placeholder="Buscar productos..."
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
            {filteredProducts.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No se encontraron resultados
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                  )}
                  onClick={() => handleSelect(product.id)}
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="size-8 rounded object-cover"
                    />
                  ) : (
                    <div className="size-8 rounded bg-muted flex items-center justify-center text-xs font-medium">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">/{product.slug}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Products as Badges */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map((product) => (
            <Badge
              key={product.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1 flex items-center"
            >
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="size-4 rounded object-cover mr-1"
                />
              ) : null}
              <span>{product.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(product.id)}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
              >
                <IconX className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Empty state */}
      {selectedProducts.length === 0 && (
        <p className="text-sm text-muted-foreground">Ningún producto seleccionado</p>
      )}
    </div>
  )
}
