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
          error: "No face was detected in one or both images. Make sure the photos clearly show your face.",
        }
      }

      return {
        match: false,
        similarity: 0,
        error: "Identity verification was not successful. The face on the ID does not match the provided photo.",
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
        error: "One of the images could not be processed. Make sure to upload clear photos in JPG or PNG format.",
      }
    }

    if (message.includes("ImageTooLargeException")) {
      return {
        match: false,
        similarity: 0,
        error: "One of the images is too large. The maximum size is 5MB per image.",
      }
    }

    // For network/service errors, don't treat as verification failure
    throw new Error(`Error del servicio de verificación: ${message}`)
  }
}
