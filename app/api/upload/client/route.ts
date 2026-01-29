import { NextRequest, NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { FOLDER_CONFIG } from "@/lib/storage"

/**
 * Client-side upload handler for large files (videos, etc.)
 * This bypasses the 4.5MB serverless function limit by uploading directly to Vercel Blob
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Extract folder from pathname (format: "folder/filename")
        const folder = pathname.split("/")[0]

        // Validate folder
        const config = FOLDER_CONFIG[folder]
        if (!config) {
          throw new Error("Carpeta no válida")
        }

        // Check authentication for non-casting uploads
        const session = await auth()

        if (folder !== "casting" && !session?.user?.id) {
          throw new Error("No autenticado")
        }

        // Check admin requirement
        if (config.requireAdmin && session?.user?.id) {
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true },
          })

          if (!user?.isAdmin) {
            throw new Error("No autorizado")
          }
        }

        return {
          allowedContentTypes: config.allowedTypes,
          maximumSizeInBytes: config.maxSize,
          tokenPayload: JSON.stringify({
            folder,
            userId: session?.user?.id,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs after the file is uploaded to Vercel Blob
        // You can add logging, database updates, etc. here
        console.log("Upload completed:", blob.url)

        try {
          const payload = JSON.parse(tokenPayload || "{}")
          console.log("Upload by user:", payload.userId, "to folder:", payload.folder)
        } catch {
          // Ignore parse errors
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Client upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al subir archivo" },
      { status: 400 }
    )
  }
}
