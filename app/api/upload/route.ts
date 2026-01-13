import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir, unlink, access } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

// Allowed folders and their max file sizes (in bytes)
const FOLDER_CONFIG: Record<string, { maxSize: number; allowedTypes: string[]; requireAdmin: boolean }> = {
  thumbnails: {
    maxSize: 4 * 1024 * 1024, // 4MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requireAdmin: true,
  },
  previews: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ["video/mp4", "video/webm"],
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
}

// Extension by MIME type
const EXTENSIONS: Record<string, string> = {
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = formData.get("folder") as string | null

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    if (!folder) {
      return NextResponse.json({ error: "No se proporcionó carpeta destino" }, { status: 400 })
    }

    // Validate folder
    const config = FOLDER_CONFIG[folder]
    if (!config) {
      return NextResponse.json({ error: "Carpeta no válida" }, { status: 400 })
    }

    // Check authentication
    const session = await auth()

    // For non-casting uploads, require authentication
    if (folder !== "casting" && !session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Check admin requirement
    if (config.requireAdmin && session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
      })

      if (!user?.isAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    // Validate file type
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Permitidos: ${config.allowedTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > config.maxSize) {
      const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1)
      return NextResponse.json(
        { error: `Archivo demasiado grande. Máximo: ${maxSizeMB}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = EXTENSIONS[file.type] || ".bin"
    const filename = `${randomUUID()}${ext}`

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "private", folder)
    await mkdir(uploadDir, { recursive: true })

    // Write file
    const filePath = path.join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return the URL path to access the file
    const url = `/api/files/${folder}/${filename}`

    return NextResponse.json({
      url,
      filename,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Eliminar archivo local
 * Body: { url: string } - La URL del archivo a eliminar (ej: /api/files/thumbnails/abc123.jpg)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Only admins can delete files
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL no proporcionada" }, { status: 400 })
    }

    // Parse the URL to get folder and filename
    // Expected format: /api/files/{folder}/{filename}
    const match = url.match(/^\/api\/files\/([^/]+)\/([^/]+)$/)
    if (!match) {
      // Not a local file URL, ignore
      return NextResponse.json({ success: true, message: "No es un archivo local" })
    }

    const [, folder, filename] = match

    // Validate folder exists in config
    if (!FOLDER_CONFIG[folder]) {
      return NextResponse.json({ error: "Carpeta no válida" }, { status: 400 })
    }

    // Construct file path
    const filePath = path.join(process.cwd(), "private", folder, filename)

    // Security: ensure the path is within the private directory
    const privatePath = path.join(process.cwd(), "private")
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(privatePath)) {
      return NextResponse.json({ error: "Ruta no válida" }, { status: 400 })
    }

    // Check if file exists and delete it
    try {
      await access(filePath)
      await unlink(filePath)
      console.log(`Deleted local file: ${filePath}`)
    } catch {
      // File doesn't exist, that's okay
      console.log(`File not found (already deleted?): ${filePath}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Error al eliminar archivo" },
      { status: 500 }
    )
  }
}
