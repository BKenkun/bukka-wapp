import Mux from "@mux/mux-node"

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  console.warn("MUX_TOKEN_ID or MUX_TOKEN_SECRET not configured")
}

// Configurar cliente Mux
export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

// Claves para firmar JWTs
const signingKeyId = process.env.MUX_SIGNING_KEY_ID
const signingKeySecret = process.env.MUX_SIGNING_KEY_PRIVATE

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
      mp4_support: "capped-1080p", // Habilita rendition MP4 capped-1080p para descarga
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
  if (!signingKeyId || !signingKeySecret) {
    throw new Error("MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_PRIVATE not configured")
  }

  // Crear JWT para playback firmado
  const token = await mux.jwt.signPlaybackId(playbackId, {
    keyId: signingKeyId,
    keySecret: signingKeySecret,
    type: "video",
    expiration: "30m",
    params: {
      // Metadatos opcionales para analytics
      ...(userId && { viewer_id: userId }),
    },
  })

  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
}

/**
 * Resoluciones máximas soportadas por Mux
 */
export type MuxMaxResolution = "720p" | "1080p" | "1440p" | "2160p"

/**
 * Convierte el formato de calidad del plan a formato Mux
 */
export function planQualityToMuxResolution(quality: string): MuxMaxResolution {
  switch (quality.toLowerCase()) {
    case "4k":
    case "2160p":
      return "2160p"
    case "1440p":
      return "1440p"
    case "1080p":
      return "1080p"
    case "720p":
    default:
      return "720p"
  }
}

/**
 * Genera un token de playback para el reproductor con restricción de calidad
 */
export async function getPlaybackToken(
  playbackId: string,
  userId?: string,
  maxResolution?: MuxMaxResolution
): Promise<string> {
  if (!signingKeyId || !signingKeySecret) {
    throw new Error("MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_PRIVATE not configured")
  }

  return await mux.jwt.signPlaybackId(playbackId, {
    keyId: signingKeyId,
    keySecret: signingKeySecret,
    type: "video",
    expiration: "30m",
    params: {
      ...(userId && { viewer_id: userId }),
      // Restricción de resolución máxima basada en suscripción
      ...(maxResolution && { max_resolution: maxResolution }),
    },
  })
}

/**
 * Genera un token para thumbnails firmados
 */
export async function getThumbnailToken(playbackId: string): Promise<string> {
  if (!signingKeyId || !signingKeySecret) {
    throw new Error("MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_PRIVATE not configured")
  }

  return await mux.jwt.signPlaybackId(playbackId, {
    keyId: signingKeyId,
    keySecret: signingKeySecret,
    type: "thumbnail",
    expiration: "2h",
  })
}

/**
 * Opciones para personalizar el GIF animado
 */
export interface GifOptions {
  start?: number      // Tiempo de inicio en segundos
  end?: number        // Tiempo de fin en segundos
  fps?: number        // Frames por segundo (8-30)
  width?: number      // Ancho en pixels
}

/**
 * Genera un token para GIFs animados firmados
 */
export async function getGifToken(playbackId: string): Promise<string> {
  if (!signingKeyId || !signingKeySecret) {
    throw new Error("MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_PRIVATE not configured")
  }

  return await mux.jwt.signPlaybackId(playbackId, {
    keyId: signingKeyId,
    keySecret: signingKeySecret,
    type: "gif",
    expiration: "2h",
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
 * Genera URL de GIF animado con opciones personalizables
 * @deprecated Usar getVideoPreviewUrl para mejor calidad
 */
export function getGifUrl(
  playbackId: string,
  token?: string,
  options?: GifOptions
): string {
  const params = new URLSearchParams()

  if (token) {
    params.set("token", token)
  }

  if (options?.start !== undefined) {
    params.set("start", options.start.toString())
  }

  if (options?.end !== undefined) {
    params.set("end", options.end.toString())
  }

  if (options?.fps !== undefined) {
    // Mux soporta fps entre 8 y 30
    const fps = Math.max(8, Math.min(30, options.fps))
    params.set("fps", fps.toString())
  }

  if (options?.width !== undefined) {
    params.set("width", options.width.toString())
  }

  const baseUrl = `https://image.mux.com/${playbackId}/animated.gif`
  const queryString = params.toString()

  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Genera URL de video MP4 para preview (mejor calidad que GIF)
 * Usa el rendition MP4 de Mux con token firmado
 */
export function getVideoPreviewUrl(
  playbackId: string,
  token?: string,
  quality: "low" | "medium" | "high" = "medium"
): string {
  // low = 640x360, medium = 960x540, high = 1280x720
  const baseUrl = `https://stream.mux.com/${playbackId}/${quality}.mp4`
  return token ? `${baseUrl}?token=${token}` : baseUrl
}

/**
 * Genera token para video MP4 (diferente tipo que para streaming)
 */
export async function getVideoToken(playbackId: string): Promise<string> {
  if (!signingKeyId || !signingKeySecret) {
    throw new Error("MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_PRIVATE not configured")
  }

  return await mux.jwt.signPlaybackId(playbackId, {
    keyId: signingKeyId,
    keySecret: signingKeySecret,
    type: "video",
    expiration: "5m",
  })
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
