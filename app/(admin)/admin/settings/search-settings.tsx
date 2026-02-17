"use client"

import * as React from "react"
import { IconLoader2, IconX, IconArrowUp, IconArrowDown, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"

interface PerformerItem {
  id: string
  name: string
  slug: string
  profileImage: string | null
}

interface VideoItem {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  status?: string
}

interface ProductItem {
  id: string
  name: string
  slug: string
  images: string[]
}

function useItemSearch<T>(apiPath: string, responseKey: string) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<T[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!query || query.length < 1) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`${apiPath}?q=${encodeURIComponent(query)}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          setResults(data[responseKey] || [])
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, apiPath, responseKey])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return { query, setQuery, results, setResults, isSearching, isOpen, setIsOpen, containerRef }
}

function FeaturedSection<T extends { id: string }>({
  title,
  description,
  defaultDescription,
  items,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
  renderItem,
  renderResult,
  searchApiPath,
  searchResponseKey,
}: {
  title: string
  description: string
  defaultDescription: string
  items: T[]
  onAdd: (item: T) => void
  onRemove: (id: string) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  renderItem: (item: T) => React.ReactNode
  renderResult: (item: T) => React.ReactNode
  searchApiPath: string
  searchResponseKey: string
}) {
  const { query, setQuery, results, setResults, isSearching, isOpen, setIsOpen, containerRef } =
    useItemSearch<T>(searchApiPath, searchResponseKey)

  const filteredResults = results.filter((r) => !items.some((i) => i.id === r.id))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search dropdown */}
        {items.length < 4 && (
          <div ref={containerRef} className="relative">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar para añadir..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setIsOpen(true)
                }}
                onFocus={() => setIsOpen(true)}
                className="pl-9"
              />
              {isSearching && (
                <IconLoader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {isOpen && filteredResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                {filteredResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                    onClick={() => {
                      onAdd(item)
                      setQuery("")
                      setResults([])
                      setIsOpen(false)
                    }}
                  >
                    {renderResult(item)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected items */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 border rounded-md bg-muted/50"
              >
                <span className="text-xs text-muted-foreground font-mono w-5 text-center shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">{renderItem(item)}</div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onMoveUp(index)}
                    disabled={index === 0}
                  >
                    <IconArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onMoveDown(index)}
                    disabled={index === items.length - 1}
                  >
                    <IconArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => onRemove(item.id)}
                  >
                    <IconX className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">{defaultDescription}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function SearchSettings() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const [performers, setPerformers] = React.useState<PerformerItem[]>([])
  const [videos, setVideos] = React.useState<VideoItem[]>([])
  const [products, setProducts] = React.useState<ProductItem[]>([])

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings/search")
      if (!res.ok) throw new Error()
      const data = await res.json()

      const { featuredPerformers, featuredVideos, featuredProducts } = data

      // Fetch full items for saved IDs in parallel
      const fetches: Promise<void>[] = []

      if (featuredPerformers?.length > 0) {
        fetches.push(
          fetch(`/api/admin/performers/search?ids=${featuredPerformers.join(",")}`)
            .then((r) => r.json())
            .then((d) => setPerformers(d.performers || []))
        )
      }

      if (featuredVideos?.length > 0) {
        fetches.push(
          fetch(`/api/admin/videos/search?ids=${featuredVideos.join(",")}`)
            .then((r) => r.json())
            .then((d) => setVideos(d.videos || []))
        )
      }

      if (featuredProducts?.length > 0) {
        fetches.push(
          fetch(`/api/admin/products/search?ids=${featuredProducts.join(",")}`)
            .then((r) => r.json())
            .then((d) => setProducts(d.products || []))
        )
      }

      await Promise.all(fetches)
    } catch (error) {
      console.error("Error loading search settings:", error)
      toast.error("Error al cargar la configuración")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/settings/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featuredPerformers: performers.map((p) => p.id),
          featuredVideos: videos.map((v) => v.id),
          featuredProducts: products.map((p) => p.id),
        }),
      })

      if (res.ok) {
        toast.success("Configuración guardada")
      } else {
        toast.error("Error al guardar")
      }
    } catch (error) {
      console.error("Error saving search settings:", error)
      toast.error("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const moveItem = <T,>(arr: T[], index: number, direction: "up" | "down"): T[] => {
    const newArr = [...arr]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]]
    return newArr
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Featured Performers */}
      <FeaturedSection<PerformerItem>
        title="Actrices Destacadas"
        description="Selecciona hasta 4 actrices que aparecerán primero en el buscador."
        defaultDescription="Si no se selecciona ninguna, se mostrarán las actrices con más seguidores."
        items={performers}
        onAdd={(item) => setPerformers((prev) => [...prev, item])}
        onRemove={(id) => setPerformers((prev) => prev.filter((p) => p.id !== id))}
        onMoveUp={(i) => setPerformers((prev) => moveItem(prev, i, "up"))}
        onMoveDown={(i) => setPerformers((prev) => moveItem(prev, i, "down"))}
        searchApiPath="/api/admin/performers/search"
        searchResponseKey="performers"
        renderResult={(item) => (
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
              {item.profileImage ? (
                <Image src={item.profileImage} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  {item.name[0]}
                </div>
              )}
            </div>
            <span className="text-sm">{item.name}</span>
          </div>
        )}
        renderItem={(item) => (
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
              {item.profileImage ? (
                <Image src={item.profileImage} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  {item.name[0]}
                </div>
              )}
            </div>
            <span className="text-sm font-medium truncate">{item.name}</span>
          </div>
        )}
      />

      {/* Featured Videos */}
      <FeaturedSection<VideoItem>
        title="Vídeos Destacados"
        description="Selecciona hasta 4 vídeos que aparecerán primero en el buscador."
        defaultDescription="Si no se selecciona ninguno, se mostrarán los vídeos más vistos."
        items={videos}
        onAdd={(item) => setVideos((prev) => [...prev, item])}
        onRemove={(id) => setVideos((prev) => prev.filter((v) => v.id !== id))}
        onMoveUp={(i) => setVideos((prev) => moveItem(prev, i, "up"))}
        onMoveDown={(i) => setVideos((prev) => moveItem(prev, i, "down"))}
        searchApiPath="/api/admin/videos/search"
        searchResponseKey="videos"
        renderResult={(item) => (
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-8 rounded overflow-hidden bg-muted shrink-0">
              {item.thumbnailUrl ? (
                <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  V
                </div>
              )}
            </div>
            <span className="text-sm truncate">{item.title}</span>
          </div>
        )}
        renderItem={(item) => (
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-8 rounded overflow-hidden bg-muted shrink-0">
              {item.thumbnailUrl ? (
                <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  V
                </div>
              )}
            </div>
            <span className="text-sm font-medium truncate">{item.title}</span>
          </div>
        )}
      />

      {/* Featured Products */}
      <FeaturedSection<ProductItem>
        title="Productos Destacados"
        description="Selecciona hasta 4 productos que aparecerán primero en el buscador."
        defaultDescription="Si no se selecciona ninguno, se mostrarán productos aleatorios."
        items={products}
        onAdd={(item) => setProducts((prev) => [...prev, item])}
        onRemove={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
        onMoveUp={(i) => setProducts((prev) => moveItem(prev, i, "up"))}
        onMoveDown={(i) => setProducts((prev) => moveItem(prev, i, "down"))}
        searchApiPath="/api/admin/products/search"
        searchResponseKey="products"
        renderResult={(item) => (
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded overflow-hidden bg-muted shrink-0">
              {item.images?.[0] ? (
                <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  P
                </div>
              )}
            </div>
            <span className="text-sm">{item.name}</span>
          </div>
        )}
        renderItem={(item) => (
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded overflow-hidden bg-muted shrink-0">
              {item.images?.[0] ? (
                <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  P
                </div>
              )}
            </div>
            <span className="text-sm font-medium truncate">{item.name}</span>
          </div>
        )}
      />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
