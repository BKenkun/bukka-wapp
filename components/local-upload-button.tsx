"use client"

import * as React from "react"
import { IconUpload, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type UploadFolder =
  | "thumbnails"
  | "previews"
  | "gallery"
  | "products"
  | "performers"
  | "banners"
  | "blog"
  | "categories"
  | "favicon"
  | "avatars"
  | "casting"
  | "footer"
  | "shop"

interface UploadResult {
  url: string
  filename: string
  size: number
  type: string
}

interface LocalUploadButtonProps {
  folder: UploadFolder
  onUploadComplete?: (result: UploadResult) => void
  onUploadError?: (error: Error) => void
  accept?: string
  maxSize?: string
  className?: string
  buttonText?: string
  disabled?: boolean
  multiple?: boolean
  onMultipleUploadComplete?: (results: UploadResult[]) => void
}

export function LocalUploadButton({
  folder,
  onUploadComplete,
  onUploadError,
  accept = "image/*",
  maxSize,
  className,
  buttonText = "Subir archivo",
  disabled = false,
  multiple = false,
  onMultipleUploadComplete,
}: LocalUploadButtonProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const uploadFile = async (file: File): Promise<UploadResult> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Error al subir archivo (${response.status})`)
    }

    return response.json()
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setProgress(0)

    try {
      if (multiple && files.length > 1) {
        // Multiple file upload
        const results: UploadResult[] = []
        const totalFiles = files.length

        for (let i = 0; i < totalFiles; i++) {
          const result = await uploadFile(files[i])
          results.push(result)
          setProgress(Math.round(((i + 1) / totalFiles) * 100))
        }

        onMultipleUploadComplete?.(results)
      } else {
        // Single file upload
        const result = await uploadFile(files[0])
        setProgress(100)
        onUploadComplete?.(result)
      }
    } catch (error) {
      console.error("Upload error:", error)
      onUploadError?.(error instanceof Error ? error : new Error("Error desconocido"))
    } finally {
      setIsUploading(false)
      setProgress(0)
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <>
            <IconLoader2 className="size-4 animate-spin" />
            Subiendo... {progress > 0 && `${progress}%`}
          </>
        ) : (
          <>
            <IconUpload className="size-4" />
            {buttonText}
          </>
        )}
      </Button>

      {maxSize && (
        <p className="text-xs text-muted-foreground">
          Máximo: {maxSize}
        </p>
      )}
    </div>
  )
}

// Dropzone component for drag & drop
interface LocalUploadDropzoneProps extends Omit<LocalUploadButtonProps, "buttonText"> {
  children?: React.ReactNode
}

export function LocalUploadDropzone({
  folder,
  onUploadComplete,
  onUploadError,
  accept = "image/*",
  maxSize,
  className,
  disabled = false,
  multiple = false,
  onMultipleUploadComplete,
  children,
}: LocalUploadDropzoneProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File): Promise<UploadResult> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Error al subir archivo (${response.status})`)
    }

    return response.json()
  }

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setIsUploading(true)
    setProgress(0)

    try {
      if (multiple && fileArray.length > 1) {
        const results: UploadResult[] = []
        const totalFiles = fileArray.length

        for (let i = 0; i < totalFiles; i++) {
          const result = await uploadFile(fileArray[i])
          results.push(result)
          setProgress(Math.round(((i + 1) / totalFiles) * 100))
        }

        onMultipleUploadComplete?.(results)
      } else {
        const result = await uploadFile(fileArray[0])
        setProgress(100)
        onUploadComplete?.(result)
      }
    } catch (error) {
      console.error("Upload error:", error)
      onUploadError?.(error instanceof Error ? error : new Error("Error desconocido"))
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const files = e.dataTransfer.files
    await processFiles(files)
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    await processFiles(files)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click()
    }
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
        isDragging && "border-primary bg-primary/5",
        !isDragging && "border-muted-foreground/25 hover:border-muted-foreground/50",
        (disabled || isUploading) && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Subiendo... {progress > 0 && `${progress}%`}
          </p>
        </div>
      ) : children ? (
        children
      ) : (
        <div className="flex flex-col items-center gap-2">
          <IconUpload className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          {maxSize && (
            <p className="text-xs text-muted-foreground">
              Máximo: {maxSize}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
