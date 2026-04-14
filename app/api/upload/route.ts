import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { uploadFile, deleteFile, FOLDER_CONFIG } from "@/lib/storage"

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

    // Upload file to R2
    const result = await uploadFile(file, folder)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Eliminar archivo
 * Body: { url: string } - La URL del archivo a eliminar
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

    const deleted = await deleteFile(url)

    return NextResponse.json({
      success: true,
      deleted,
      message: deleted ? "Archivo eliminado" : "No se pudo eliminar o no existía"
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Error al eliminar archivo" },
      { status: 500 }
    )
  }
}
