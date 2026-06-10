import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { FOLDER_CONFIG, createPresignedUploadUrl } from "@/lib/storage"

/**
 * Generate a presigned URL for direct client-side upload to R2
 * Used for large files that exceed the serverless function limit
 */
export async function POST(request: NextRequest) {
  try {
    const { folder, filename, contentType } = await request.json()

    // Validate folder
    const config = FOLDER_CONFIG[folder]
    if (!config) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
    }

    // Validate content type
    if (!config.allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    // Check authentication
    const session = await auth()
    if (folder !== "casting" && !session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check admin requirement
    if (config.requireAdmin && session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
      })

      if (!user?.isAdmin) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
      }
    }

    const { uploadUrl, publicUrl } = await createPresignedUploadUrl(
      folder,
      filename,
      contentType
    )

    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (error) {
    console.error("Presigned URL error:", error)
    return NextResponse.json(
      { error: "Error generating upload URL" },
      { status: 500 }
    )
  }
}
