import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { readFile, stat } from "fs/promises"
import path from "path"

// Define access levels for each folder type
const ACCESS_LEVELS: Record<string, "public" | "auth" | "subscription" | "admin"> = {
  thumbnails: "public",      // Video thumbnails - public
  favicon: "public",         // Favicon - public
  banners: "public",         // Banners - public
  blog: "public",            // Blog images - public
  categories: "public",      // Category images - public
  previews: "auth",          // Video previews - requires login
  gallery: "auth",           // Video gallery - requires login
  products: "auth",          // Product images - requires login
  performers: "auth",        // Performer images - requires login
  avatars: "auth",           // User avatars - requires login
  casting: "admin",          // Casting documents - admin only
}

// Minimum subscription level for subscription-protected content
const SUBSCRIPTION_LEVELS: Record<string, number> = {
  // Add folders that require specific subscription levels here
  // e.g., "exclusive-gallery": 3 (Gold level)
}

// MIME types by extension
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }

    // Get folder type (first segment)
    const folderType = pathSegments[0]
    const accessLevel = ACCESS_LEVELS[folderType]

    if (!accessLevel) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
    }

    // Check access based on level
    if (accessLevel !== "public") {
      const session = await auth()

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }

      if (accessLevel === "admin") {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { isAdmin: true },
        })

        if (!user?.isAdmin) {
          return NextResponse.json({ error: "Not authorized" }, { status: 403 })
        }
      }

      if (accessLevel === "subscription") {
        const requiredLevel = SUBSCRIPTION_LEVELS[folderType] || 0

        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { SubscriptionPlan: true },
        })

        const userLevel = user?.SubscriptionPlan?.level || 0

        if (userLevel < requiredLevel) {
          return NextResponse.json(
            { error: "Subscription required" },
            { status: 403 }
          )
        }
      }
    }

    // Build file path (sanitize to prevent directory traversal)
    const sanitizedPath = pathSegments.map(segment =>
      segment.replace(/[^a-zA-Z0-9_\-\.]/g, "")
    ).join("/")

    const filePath = path.join(process.cwd(), "private", sanitizedPath)

    // Verify file is within private directory
    const privateDir = path.join(process.cwd(), "private")
    const resolvedPath = path.resolve(filePath)

    if (!resolvedPath.startsWith(privateDir)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if file exists
    try {
      await stat(filePath)
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Get MIME type
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || "application/octet-stream"

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": accessLevel === "public"
          ? "public, max-age=31536000, immutable"
          : "private, max-age=3600",
        // Prevent direct download for protected content
        "Content-Disposition": "inline",
        // Security headers
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json(
      { error: "Error serving file" },
      { status: 500 }
    )
  }
}
