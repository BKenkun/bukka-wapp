import { deleteFile, isLocalFileUrl, isBlobUrl, isR2Url } from "./storage"

/**
 * Delete a file from storage
 */
export async function deleteLocalFile(url: string | null | undefined): Promise<boolean> {
  if (!url) return false
  return deleteFile(url)
}

/**
 * Check if a URL is a managed file URL (R2, legacy local, or legacy blob)
 */
export function isManagedFileUrl(url: string | null | undefined): boolean {
  return isR2Url(url) || isLocalFileUrl(url) || isBlobUrl(url)
}

export { isLocalFileUrl, isBlobUrl, isR2Url }
