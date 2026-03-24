import {
  RekognitionClient,
  CompareFacesCommand,
} from "@aws-sdk/client-rekognition"

const client = new RekognitionClient({
  region: process.env.AWS_REGION || "eu-west-1",
  // Credentials are resolved automatically:
  // - EC2: IAM Role via Instance Metadata Service
  // - Local: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY env vars
})

interface CompareFacesResult {
  match: boolean
  similarity: number
  error?: string
}

/**
 * Compare two faces using AWS Rekognition.
 * Processes images in-memory only — no files are stored.
 *
 * @param sourceBuffer - Buffer of the source image (DNI photo)
 * @param targetBuffer - Buffer of the target image (selfie/general photo)
 * @param threshold - Minimum similarity percentage (default 90)
 */
export async function compareFaces(
  sourceBuffer: Buffer,
  targetBuffer: Buffer,
  threshold: number = 90
): Promise<CompareFacesResult> {
  try {
    const command = new CompareFacesCommand({
      SourceImage: { Bytes: new Uint8Array(sourceBuffer) },
      TargetImage: { Bytes: new Uint8Array(targetBuffer) },
      SimilarityThreshold: threshold,
    })

    const response = await client.send(command)

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      // No matches found above the threshold
      const unmatchedCount = response.UnmatchedFaces?.length ?? 0

      if (unmatchedCount === 0) {
        return {
          match: false,
          similarity: 0,
          error: "No se detectó un rostro en una o ambas imágenes. Asegúrate de que las fotos muestren tu cara claramente.",
        }
      }

      return {
        match: false,
        similarity: 0,
        error: "La verificación de identidad no fue exitosa. El rostro del DNI no coincide con la foto proporcionada.",
      }
    }

    const bestMatch = response.FaceMatches[0]
    const similarity = bestMatch.Similarity ?? 0

    return {
      match: similarity >= threshold,
      similarity,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido"

    // Handle specific Rekognition errors
    if (message.includes("InvalidParameterException")) {
      return {
        match: false,
        similarity: 0,
        error: "No se pudo procesar una de las imágenes. Asegúrate de subir fotos claras en formato JPG o PNG.",
      }
    }

    if (message.includes("ImageTooLargeException")) {
      return {
        match: false,
        similarity: 0,
        error: "Una de las imágenes es demasiado grande. El tamaño máximo es 5MB por imagen.",
      }
    }

    // For network/service errors, don't treat as verification failure
    throw new Error(`Error del servicio de verificación: ${message}`)
  }
}
