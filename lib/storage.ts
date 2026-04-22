import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"

// R2 client
const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const R2_BUCKET = process.env.R2_BUCKET || "bukkakery"
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL! // e.g. https://cdn.bukkakery.com

// Extension by MIME type
export const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "application/pdf": ".pdf",
}

// Folder configuration
// Política: subir a máxima calidad. Imágenes hasta 50 MB en el lado del admin;
// el navegador hace el crop automático en cada contexto con object-cover +
// aspect-ratio (home, tarjetas, tabla admin). Si se necesita compresión real
// se añade Sharp más adelante como paso post-upload.
const IMAGE_MAX = 50 * 1024 * 1024 // 50 MB
export const FOLDER_CONFIG: Record<string, { maxSize: number; allowedTypes: string[]; requireAdmin: boolean }> = {
  thumbnails: {
    maxSize: IMAGE_MAX,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  previews: {
    maxSize: 512 * 1024 * 1024,
    allowedTypes: ["video/mp4", "video/webm", "video/quicktime"],
    requireAdmin: true,
  },
  videos: {
    maxSize: 5 * 1024 * 1024 * 1024,
    allowedTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/avi", "video/x-msvideo"],
    requireAdmin: true,
  },
  gallery: {
    maxSize: IMAGE_MAX,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  products: {
    maxSize: IMAGE_MAX,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  performers: {
    maxSize: IMAGE_MAX,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  banners: {
    maxSize: IMAGE_MAX,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    requireAdmin: true,
  },
  blog: {
    maxSize: IMAGE_MAX,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    requireAdmin: true,
  },
  categories: {
    maxSize: IMAGE_MAX,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  favicon: {
    maxSize: 1 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"],
    requireAdmin: true,
  },
  avatars: {
    maxSize: 20 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: false,
  },
  casting: {
    maxSize: 20 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    requireAdmin: false,
  },
  "casting-video": {
    maxSize: 200 * 1024 * 1024,
    allowedTypes: ["video/mp4", "video/webm", "video/quicktime"],
    requireAdmin: false,
  },
  hero: {
    maxSize: 200 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"],
    requireAdmin: true,
  },
  settings: {
    maxSize: IMAGE_MAX,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  cta: {
    maxSize: 200 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"],
    requireAdmin: true,
  },
  countdown: {
    maxSize: 200 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"],
    requireAdmin: true,
  },
  shop: {
    maxSize: IMAGE_MAX,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  footer: {
    maxSize: IMAGE_MAX,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
}

interface UploadResult {
  url: string
  filename: string
  size: number
  type: string
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFile(
  file: File,
  folder: string
): Promise<UploadResult> {
  const ext = EXTENSIONS[file.type] || ".bin"
  const filename = `${randomUUID()}${ext}`
  const key = `${folder}/${filename}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  await R2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  )

  return {
    url: `${R2_PUBLIC_URL}/${key}`,
    filename,
    size: file.size,
    type: file.type,
  }
}

/**
 * Generate a presigned URL for direct client-side upload to R2
 */
export async function createPresignedUploadUrl(
  folder: string,
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const ext = EXTENSIONS[contentType] || ".bin"
  const safeFilename = `${randomUUID()}${ext}`
  const key = `${folder}/${safeFilename}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(R2, command, { expiresIn: 3600 })

  return {
    uploadUrl,
    publicUrl: `${R2_PUBLIC_URL}/${key}`,
    key,
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFile(url: string): Promise<boolean> {
  if (!url) return false

  // Extract key from R2 public URL
  if (url.startsWith(R2_PUBLIC_URL)) {
    const key = url.replace(`${R2_PUBLIC_URL}/`, "")
    try {
      await R2.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        })
      )
      return true
    } catch (error) {
      console.error("Error deleting R2 file:", error)
      return false
    }
  }

  // Legacy: handle old Vercel Blob URLs (just return true, files already gone)
  if (url.includes(".vercel-storage.com")) {
    return true
  }

  // Legacy: handle old local file URLs (just return true, files on server filesystem)
  if (url.startsWith("/uploads/") || url.startsWith("/api/files/")) {
    return true
  }

  return false
}

/**
 * Check if a URL is a managed file URL (R2, legacy local, or legacy blob)
 */
export function isLocalFileUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /^\/uploads\/[^/]+\/[^/]+$/.test(url) || /^\/api\/files\/[^/]+\/[^/]+$/.test(url)
}

export function isBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes(".vercel-storage.com") || url.includes(".public.blob.vercel-storage.com")
}

export function isR2Url(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith(R2_PUBLIC_URL)
}
