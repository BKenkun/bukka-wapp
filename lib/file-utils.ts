import { deleteFile, isLocalFileUrl, isBlobUrl } from "./storage"

/**
 * Delete a file from storage (local or cloud)
 * @param url - The URL of the file
 * @returns true if deleted, false if not found or couldn't delete
 */
export async function deleteLocalFile(url: string | null | undefined): Promise<boolean> {
  if (!url) return false
  return deleteFile(url)
}

/**
 * Check if a URL is a managed file URL (local or blob)
 */
export function isManagedFileUrl(url: string | null | undefined): boolean {
  return isLocalFileUrl(url) || isBlobUrl(url)
}

// Re-export for backwards compatibility
export { isLocalFileUrl, isBlobUrl }
