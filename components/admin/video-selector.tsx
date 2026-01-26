"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Search, GripVertical, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Video {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  status: string
}

interface VideoSelectorProps {
  value: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
}

export function VideoSelector({
  value,
  onChange,
  placeholder = "Buscar videos...",
}: VideoSelectorProps) {
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Video[]>([])
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Fetch selected videos on mount
  useEffect(() => {
    if (value.length > 0) {
      fetchSelectedVideos(value)
    } else {
      setSelectedVideos([])
    }
  }, [])

  const fetchSelectedVideos = async (ids: string[]) => {
    if (ids.length === 0) return

    try {
      const res = await fetch(`/api/admin/videos/search?ids=${ids.join(",")}`)
      const data = await res.json()
      if (data.videos) {
        setSelectedVideos(data.videos)
      }
    } catch (error) {
      console.error("Error fetching selected videos:", error)
    }
  }

  const searchVideos = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/videos/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.videos) {
        // Filter out already selected videos
        setSearchResults(data.videos.filter((v: Video) => !value.includes(v.id)))
      }
    } catch (error) {
      console.error("Error searching videos:", error)
    } finally {
      setIsLoading(false)
    }
  }, [value])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        searchVideos(search)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, searchVideos])

  const handleSelect = (video: Video) => {
    const newSelectedVideos = [...selectedVideos, video]
    setSelectedVideos(newSelectedVideos)
    onChange([...value, video.id])
    setSearch("")
    setSearchResults([])
  }

  const handleRemove = (videoId: string) => {
    const newSelectedVideos = selectedVideos.filter((v) => v.id !== videoId)
    setSelectedVideos(newSelectedVideos)
    onChange(value.filter((id) => id !== videoId))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newSelectedVideos = [...selectedVideos]
    const [draggedVideo] = newSelectedVideos.splice(draggedIndex, 1)
    newSelectedVideos.splice(index, 0, draggedVideo)
    setSelectedVideos(newSelectedVideos)
    onChange(newSelectedVideos.map((v) => v.id))
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-3">
      {/* Selected videos */}
      {selectedVideos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {selectedVideos.length} video{selectedVideos.length !== 1 ? "s" : ""} seleccionado{selectedVideos.length !== 1 ? "s" : ""} - arrastra para reordenar
          </p>
          <div className="space-y-2">
            {selectedVideos.map((video, index) => (
              <div
                key={video.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md border bg-card",
                  "cursor-move hover:border-primary/50 transition-colors",
                  draggedIndex === index && "opacity-50 border-primary"
                )}
              >
                <GripVertical className="size-4 text-muted-foreground flex-shrink-0" />
                <div className="relative size-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground text-xs">
                      Sin img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{video.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{video.slug}</p>
                </div>
                <Badge variant={video.status === "PUBLISHED" ? "default" : "secondary"} className="flex-shrink-0">
                  {video.status === "PUBLISHED" ? "Publicado" : video.status}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleRemove(video.id)}
                  className="p-1 hover:bg-destructive/10 rounded text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search results dropdown */}
      {isOpen && search && (
        <div className="relative">
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => {
                    handleSelect(video)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-accent text-left transition-colors"
                >
                  <div className="relative size-10 flex-shrink-0 overflow-hidden rounded bg-muted">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground text-[10px]">
                        Sin img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{video.slug}</p>
                  </div>
                  <Badge
                    variant={video.status === "PUBLISHED" ? "default" : "secondary"}
                    className="flex-shrink-0 text-[10px]"
                  >
                    {video.status === "PUBLISHED" ? "Pub" : video.status}
                  </Badge>
                </button>
              ))
            ) : !isLoading && search ? (
              <p className="p-4 text-sm text-center text-muted-foreground">
                No se encontraron videos
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
