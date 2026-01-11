"use client"

import * as React from "react"
import Image from "next/image"
import { IconTrash, IconLoader2, IconPlus, IconGripVertical } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { useUploadThing } from "@/lib/uploadthing-client"

interface Photo {
  id: string
  imageUrl: string
  caption: string | null
  order: number
}

interface PerformerGalleryProps {
  performerSlug: string
  initialPhotos?: Photo[]
}

export function PerformerGallery({ performerSlug, initialPhotos = [] }: PerformerGalleryProps) {
  const [photos, setPhotos] = React.useState<Photo[]>(initialPhotos)
  const [isLoading, setIsLoading] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing("performerImages", {
    onClientUploadComplete: async (res) => {
      if (res) {
        // Add each uploaded photo to the gallery via API
        for (const file of res) {
          try {
            const response = await fetch(`/api/performers/${performerSlug}/photos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: file.ufsUrl }),
            })

            if (response.ok) {
              const newPhoto = await response.json()
              setPhotos((prev) => [...prev, newPhoto])
            }
          } catch (error) {
            console.error("Error adding photo:", error)
          }
        }
        toast.success("Fotos subidas correctamente")
      }
    },
    onUploadError: (error) => {
      toast.error(`Error al subir: ${error.message}`)
    },
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    await startUpload(fileArray)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (photoId: string) => {
    setDeletingId(photoId)

    try {
      const response = await fetch(`/api/performers/${performerSlug}/photos/${photoId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId))
        toast.success("Foto eliminada")
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar")
      }
    } catch (error) {
      toast.error("Error al eliminar la foto")
    } finally {
      setDeletingId(null)
    }
  }

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const newPhotos = [...photos]
    const [removed] = newPhotos.splice(fromIndex, 1)
    newPhotos.splice(toIndex, 0, removed)
    setPhotos(newPhotos)

    // Save new order to API
    try {
      await fetch(`/api/performers/${performerSlug}/photos/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: newPhotos.map((p) => p.id),
        }),
      })
    } catch (error) {
      console.error("Error reordering:", error)
      // Revert on error
      setPhotos(photos)
    }
  }

  // Simple drag and drop state
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    handleReorder(draggedIndex, index)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Galeria de Fotos</CardTitle>
        <CardDescription>
          Sube fotos para la galeria de esta actriz. Arrastra para reordenar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Upload Button */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <IconPlus className="mr-2 size-4" />
                Subir Fotos
              </>
            )}
          </Button>
        </div>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay fotos en la galeria. Sube algunas fotos para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                  draggedIndex === index
                    ? "border-primary opacity-50"
                    : "border-transparent hover:border-primary/50"
                } cursor-move`}
              >
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption || `Foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div className="absolute top-2 left-2">
                    <IconGripVertical className="size-5 text-white" />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(photo.id)}
                    disabled={deletingId === photo.id}
                  >
                    {deletingId === photo.id ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                      <IconTrash className="size-4" />
                    )}
                  </Button>
                </div>

                {/* Order indicator */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
