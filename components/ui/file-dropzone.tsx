"use client"

import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { Upload, X, FileVideo, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "./button"

interface FileDropzoneProps {
  value?: string | null
  onChange: (url: string | null) => void
  accept?: "image" | "video" | "both"
  folder: string
  maxSize?: number
  className?: string
  placeholder?: string
}

export function FileDropzone({
  value,
  onChange,
  accept = "both",
  folder,
  maxSize,
  className,
  placeholder,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const acceptedTypes = {
    image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    video: ["video/mp4", "video/webm"],
    both: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"],
  }

  const acceptString = {
    image: "image/jpeg,image/png,image/webp,image/gif",
    video: "video/mp4,video/webm",
    both: "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm",
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const uploadFile = async (file: File) => {
    setError(null)
    setIsUploading(true)

    try {
      // Validate file type
      if (!acceptedTypes[accept].includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido. Permitidos: ${accept === "image" ? "imágenes" : accept === "video" ? "videos" : "imágenes y videos"}`)
      }

      // Validate file size if specified
      if (maxSize && file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
        throw new Error(`Archivo demasiado grande. Máximo: ${maxSizeMB}MB`)
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al subir archivo")
      }

      const data = await response.json()
      onChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivo")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      await uploadFile(files[0])
    }
  }, [accept, folder, maxSize, onChange])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await uploadFile(files[0])
    }
    e.target.value = ""
  }

  const handleRemove = async () => {
    if (value) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
        })
      } catch {
        // Ignore delete errors
      }
    }
    onChange(null)
  }

  const isVideo = value?.match(/\.(mp4|webm)$/i)
  const isImage = value && !isVideo

  const defaultPlaceholder = accept === "image"
    ? "Arrastra una imagen aquí o haz clic para seleccionar"
    : accept === "video"
    ? "Arrastra un video aquí o haz clic para seleccionar"
    : "Arrastra un archivo aquí o haz clic para seleccionar"

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
          {isVideo ? (
            <video
              src={value}
              className="w-full h-48 object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={value}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            {isVideo ? <FileVideo className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
            {isVideo ? "Video" : "Imagen"}
          </div>
        </div>
      ) : (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {placeholder || defaultPlaceholder}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {accept === "image" && "JPG, PNG, WebP, GIF"}
                  {accept === "video" && "MP4, WebM"}
                  {accept === "both" && "JPG, PNG, WebP, GIF, MP4, WebM"}
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept={acceptString[accept]}
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
