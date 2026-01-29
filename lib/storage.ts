import { put, del } from "@vercel/blob"
import { writeFile, mkdir, unlink, access } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

// Check if we should use Vercel Blob (production) or local storage (development)
const useVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN

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
export const FOLDER_CONFIG: Record<string, { maxSize: number; allowedTypes: string[]; requireAdmin: boolean }> = {
  thumbnails: {
    maxSize: 4 * 1024 * 1024, // 4MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  previews: {
    maxSize: 512 * 1024 * 1024, // 512MB
    allowedTypes: ["video/mp4", "video/webm", "video/quicktime"],
    requireAdmin: true,
  },
  videos: {
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    allowedTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/avi", "video/x-msvideo"],
    requireAdmin: true,
  },
  gallery: {
    maxSize: 4 * 1024 * 1024, // 4MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  products: {
    maxSize: 4 * 1024 * 1024, // 4MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  performers: {
    maxSize: 4 * 1024 * 1024, // 4MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  banners: {
    maxSize: 8 * 1024 * 1024, // 8MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    requireAdmin: true,
  },
  blog: {
    maxSize: 4 * 1024 * 1024, // 4MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    requireAdmin: true,
  },
  categories: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  favicon: {
    maxSize: 512 * 1024, // 512KB
    allowedTypes: ["image/jpeg", "image/png", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"],
    requireAdmin: true,
  },
  avatars: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: false, // Users can upload their own avatars
  },
  casting: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    requireAdmin: false, // Public casting form
  },
  hero: {
    maxSize: 100 * 1024 * 1024, // 100MB (para videos)
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"],
    requireAdmin: true,
  },
  settings: {
    maxSize: 4 * 1024 * 1024, // 4MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  cta: {
    maxSize: 100 * 1024 * 1024, // 100MB (para videos)
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"],
    requireAdmin: true,
  },
  countdown: {
    maxSize: 100 * 1024 * 1024, // 100MB (para videos)
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"],
    requireAdmin: true,
  },
  shop: {
    maxSize: 8 * 1024 * 1024, // 8MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  footer: {
    maxSize: 4 * 1024 * 1024, // 4MB
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
 * Upload a file to storage (Vercel Blob in production, local in development)
 */
export async function uploadFile(
  file: File,
  folder: string
): Promise<UploadResult> {
  const ext = EXTENSIONS[file.type] || ".bin"
  const filename = `${randomUUID()}${ext}`
  const pathname = `${folder}/${filename}`

  if (useVercelBlob) {
    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
    })

    return {
      url: blob.url,
      filename,
      size: file.size,
      type: file.type,
    }
  } else {
    // Upload to local storage (public folder for direct access)
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder)
    await mkdir(uploadDir, { recursive: true })

    const filePath = path.join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    return {
      url: `/uploads/${folder}/${filename}`,
      filename,
      size: file.size,
      type: file.type,
    }
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(url: string): Promise<boolean> {
  if (!url) return false

  // Check if it's a Vercel Blob URL
  if (url.includes(".vercel-storage.com") || url.includes(".public.blob.vercel-storage.com")) {
    try {
      await del(url)
      console.log(`Deleted blob file: ${url}`)
      return true
    } catch (error) {
      console.error("Error deleting blob file:", error)
      return false
    }
  }

  // Check if it's a local file URL (new format: /uploads/... or old format: /api/files/...)
  const newMatch = url.match(/^\/uploads\/([^/]+)\/([^/]+)$/)
  const oldMatch = url.match(/^\/api\/files\/([^/]+)\/([^/]+)$/)
  const match = newMatch || oldMatch

  if (!match) {
    return false
  }

  const [, folder, filename] = match

  // Construct file path based on which format was matched
  const basePath = newMatch ? "public/uploads" : "private"
  const filePath = path.join(process.cwd(), basePath, folder, filename)

  // Security: ensure the path is within the allowed directory
  const allowedPath = path.join(process.cwd(), basePath)
  const resolvedPath = path.resolve(filePath)
  if (!resolvedPath.startsWith(allowedPath)) {
    console.warn(`Attempted to delete file outside allowed directory: ${filePath}`)
    return false
  }

  // Check if file exists and delete it
  try {
    await access(filePath)
    await unlink(filePath)
    console.log(`Deleted local file: ${filePath}`)
    return true
  } catch {
    console.log(`File not found (already deleted?): ${filePath}`)
    return false
  }
}

/**
 * Check if a URL is a local file URL
 */
export function isLocalFileUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /^\/uploads\/[^/]+\/[^/]+$/.test(url) || /^\/api\/files\/[^/]+\/[^/]+$/.test(url)
}

/**
 * Check if a URL is a Vercel Blob URL
 */
export function isBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes(".vercel-storage.com") || url.includes(".public.blob.vercel-storage.com")
}
