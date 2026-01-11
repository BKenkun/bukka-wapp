import Mux from "@mux/mux-node"

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  console.warn("MUX_TOKEN_ID or MUX_TOKEN_SECRET not configured")
}

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

export interface CreateUploadResult {
  uploadUrl: string
  uploadId: string
}

/**
 * Crea un nuevo upload para subir un video a Mux
 */
export async function createMuxUpload(): Promise<CreateUploadResult> {
  const upload = await mux.video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    new_asset_settings: {
      playback_policy: ["signed"], // URLs firmadas para protección
      encoding_tier: "smart",
      master_access: "temporary", // Permite descargas temporales
    },
  })

  return {
    uploadUrl: upload.url,
    uploadId: upload.id,
  }
}

/**
 * Obtiene información de un asset de Mux
 */
export async function getMuxAsset(assetId: string) {
  return await mux.video.assets.retrieve(assetId)
}

/**
 * Elimina un asset de Mux
 */
export async function deleteMuxAsset(assetId: string) {
  return await mux.video.assets.delete(assetId)
}

/**
 * Genera una URL de playback firmada para un video
 */
export async function getSignedPlaybackUrl(
  playbackId: string,
  userId?: string
): Promise<string> {
  const signingKeyId = process.env.MUX_SIGNING_KEY_ID
  const signingKeyPrivate = process.env.MUX_SIGNING_KEY_PRIVATE

  if (!signingKeyId || !signingKeyPrivate) {
    throw new Error("MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_PRIVATE not configured")
  }

  // Crear JWT para playback firmado
  const token = await mux.jwt.signPlaybackId(playbackId, {
    type: "video",
    expiration: "4h",
    params: {
      // Metadatos opcionales para analytics
      ...(userId && { viewer_id: userId }),
    },
  })

  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
}

/**
 * Genera un token de playback para el reproductor
 */
export async function getPlaybackToken(
  playbackId: string,
  userId?: string
): Promise<string> {
  const signingKeyId = process.env.MUX_SIGNING_KEY_ID
  const signingKeyPrivate = process.env.MUX_SIGNING_KEY_PRIVATE

  if (!signingKeyId || !signingKeyPrivate) {
    throw new Error("MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_PRIVATE not configured")
  }

  return await mux.jwt.signPlaybackId(playbackId, {
    type: "video",
    expiration: "4h",
    params: {
      ...(userId && { viewer_id: userId }),
    },
  })
}

/**
 * Genera un token para thumbnails firmados
 */
export async function getThumbnailToken(playbackId: string): Promise<string> {
  const signingKeyId = process.env.MUX_SIGNING_KEY_ID
  const signingKeyPrivate = process.env.MUX_SIGNING_KEY_PRIVATE

  if (!signingKeyId || !signingKeyPrivate) {
    throw new Error("MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_PRIVATE not configured")
  }

  return await mux.jwt.signPlaybackId(playbackId, {
    type: "thumbnail",
    expiration: "24h",
  })
}

/**
 * Genera un token para GIFs animados firmados
 */
export async function getGifToken(playbackId: string): Promise<string> {
  const signingKeyId = process.env.MUX_SIGNING_KEY_ID
  const signingKeyPrivate = process.env.MUX_SIGNING_KEY_PRIVATE

  if (!signingKeyId || !signingKeyPrivate) {
    throw new Error("MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_PRIVATE not configured")
  }

  return await mux.jwt.signPlaybackId(playbackId, {
    type: "gif",
    expiration: "24h",
  })
}

/**
 * Genera URL de thumbnail
 */
export function getThumbnailUrl(playbackId: string, token?: string): string {
  const baseUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`
  return token ? `${baseUrl}?token=${token}` : baseUrl
}

/**
 * Genera URL de GIF animado
 */
export function getGifUrl(playbackId: string, token?: string): string {
  const baseUrl = `https://image.mux.com/${playbackId}/animated.gif`
  return token ? `${baseUrl}?token=${token}` : baseUrl
}

/**
 * Crea un clip de preview del video
 */
export async function createPreviewClip(
  assetId: string,
  startTime: number = 0,
  endTime: number = 30
) {
  // Mux no tiene una API directa para clips, pero podemos usar storyboards
  // o crear assets con input_url que referencien el tiempo
  // Por ahora retornamos info del asset para usar en el player
  const asset = await getMuxAsset(assetId)
  return {
    playbackId: asset.playback_ids?.[0]?.id,
    duration: asset.duration,
    previewStart: startTime,
    previewEnd: endTime,
  }
}

/**
 * Verifica el estado de un upload
 */
export async function getUploadStatus(uploadId: string) {
  const upload = await mux.video.uploads.retrieve(uploadId)
  return {
    status: upload.status,
    assetId: upload.asset_id,
  }
}
