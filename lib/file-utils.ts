import { unlink, access } from "fs/promises"
import path from "path"

/**
 * Delete a local file from the private directory
 * @param url - The URL of the file (e.g., /api/files/thumbnails/abc123.jpg)
 * @returns true if deleted, false if not a local file or doesn't exist
 */
export async function deleteLocalFile(url: string | null | undefined): Promise<boolean> {
  if (!url) return false

  // Parse the URL to get folder and filename
  // Expected format: /api/files/{folder}/{filename}
  const match = url.match(/^\/api\/files\/([^/]+)\/([^/]+)$/)
  if (!match) {
    // Not a local file URL
    return false
  }

  const [, folder, filename] = match

  // Construct file path
  const filePath = path.join(process.cwd(), "private", folder, filename)

  // Security: ensure the path is within the private directory
  const privatePath = path.join(process.cwd(), "private")
  const resolvedPath = path.resolve(filePath)
  if (!resolvedPath.startsWith(privatePath)) {
    console.warn(`Attempted to delete file outside private directory: ${filePath}`)
    return false
  }

  // Check if file exists and delete it
  try {
    await access(filePath)
    await unlink(filePath)
    console.log(`Deleted local file: ${filePath}`)
    return true
  } catch {
    // File doesn't exist
    console.log(`File not found (already deleted?): ${filePath}`)
    return false
  }
}

/**
 * Check if a URL is a local file URL
 */
export function isLocalFileUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /^\/api\/files\/[^/]+\/[^/]+$/.test(url)
}
