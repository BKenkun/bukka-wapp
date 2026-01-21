"use client"

import * as React from "react"
import Image from "next/image"
import { IconX, IconGripVertical, IconPhoto, IconLoader2, IconStar, IconStarFilled, IconUpload } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ProductImageGalleryProps {
  images: string[]
  onChange: (images: string[]) => void
}

export function ProductImageGallery({ images, onChange }: ProductImageGalleryProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleSetPrimary = (index: number) => {
    if (index === 0) return // Already primary
    const newImages = [...images]
    const [removed] = newImages.splice(index, 1)
    newImages.unshift(removed)
    onChange(newImages)
  }

  // Drag and drop handlers for reordering images
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
    setTimeout(() => {
      const target = e.target as HTMLElement
      target.style.opacity = "0.5"
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement
    target.style.opacity = "1"
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"))

    if (dragIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newImages = [...images]
    const [draggedItem] = newImages.splice(dragIndex, 1)
    newImages.splice(dropIndex, 0, draggedItem)
    onChange(newImages)

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Upload files using /api/upload
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return

    const validFiles = files.filter((file) => {
      const isValidType = ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      const isValidSize = file.size <= 4 * 1024 * 1024 // 4MB
      if (!isValidType) {
        toast.error(`${file.name}: Tipo no válido. Solo JPG, PNG, WebP`)
      }
      if (!isValidSize) {
        toast.error(`${file.name}: Demasiado grande. Máximo 4MB`)
      }
      return isValidType && isValidSize
    })

    if (validFiles.length === 0) return

    setIsUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of validFiles) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "products")

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          uploadedUrls.push(data.url)
        } else {
          const error = await res.json()
          toast.error(`Error subiendo ${file.name}: ${error.error}`)
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls])
        toast.success(`${uploadedUrls.length} imagen${uploadedUrls.length > 1 ? "es subidas" : " subida"} correctamente`)
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Error al subir imágenes")
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    uploadFiles(files)
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle dropzone drag events
  const handleDropzoneDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDropzoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDropzoneDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    uploadFiles(files)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="space-y-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload Button */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <IconUpload className="mr-2 size-4" />
            )}
            {isUploading ? "Subiendo..." : "Subir imágenes"}
          </Button>
          <span className="text-sm text-muted-foreground">o arrastra imágenes abajo</span>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDropzoneDragOver}
          onDragLeave={handleDropzoneDragLeave}
          onDrop={handleDropzoneDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 min-h-[120px] flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer
            ${isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            ${isUploading ? "pointer-events-none opacity-50" : ""}
          `}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Subiendo imágenes...</p>
            </>
          ) : (
            <>
              <IconUpload className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragOver ? "Suelta las imágenes aquí" : "Arrastra imágenes aquí o haz clic"}
              </p>
              <p className="text-xs text-muted-foreground/70">JPG, PNG, WebP hasta 4MB</p>
            </>
          )}
        </div>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {images.length} imagen{images.length > 1 ? "es" : ""} - Arrastra para reordenar
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing
                  ${dragOverIndex === index ? "border-primary scale-105 shadow-lg" : "border-transparent"}
                  ${draggedIndex === index ? "opacity-50" : ""}
                  ${index === 0 ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                `}
              >
                {/* Image */}
                <Image
                  src={url}
                  alt={`Producto imagen ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Drag handle indicator */}
                  <div className="absolute top-2 left-2">
                    <IconGripVertical className="size-5 text-white/70" />
                  </div>

                  {/* Set as primary */}
                  {index !== 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="size-8"
                      onClick={() => handleSetPrimary(index)}
                      title="Establecer como principal"
                    >
                      <IconStar className="size-4" />
                    </Button>
                  )}

                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="size-8"
                    onClick={() => handleRemoveImage(index)}
                    title="Eliminar imagen"
                  >
                    <IconX className="size-4" />
                  </Button>
                </div>

                {/* Primary badge */}
                {index === 0 && (
                  <Badge className="absolute bottom-2 left-2 bg-primary text-primary-foreground gap-1">
                    <IconStarFilled className="size-3" />
                    Principal
                  </Badge>
                )}

                {/* Index indicator */}
                {index !== 0 && (
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !isUploading && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <IconPhoto className="size-12 mb-2 opacity-20" />
          <p className="text-sm">No hay imágenes</p>
          <p className="text-xs">Sube imágenes usando el área de arriba</p>
        </div>
      )}
    </div>
  )
}
