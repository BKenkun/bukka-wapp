import { NextRequest, NextResponse } from "next/server"
import { compareFaces } from "@/lib/rekognition"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const dniPhoto = formData.get("dniPhoto") as File | null
    const selfiePhoto = formData.get("selfiePhoto") as File | null

    if (!dniPhoto || !selfiePhoto) {
      return NextResponse.json(
        { verified: false, similarity: 0, error: "Both photos are required: ID and personal photo" },
        { status: 400 }
      )
    }

    // Validate file types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(dniPhoto.type) || !allowedTypes.includes(selfiePhoto.type)) {
      return NextResponse.json(
        { verified: false, similarity: 0, error: "Images must be JPG, PNG or WebP" },
        { status: 400 }
      )
    }

    // Convert to buffers (in-memory only, never stored)
    const dniBuffer = Buffer.from(await dniPhoto.arrayBuffer())
    const selfieBuffer = Buffer.from(await selfiePhoto.arrayBuffer())

    // Compare faces via Rekognition
    const result = await compareFaces(dniBuffer, selfieBuffer, 90)

    // Buffers are garbage collected after this point — nothing is saved to disk

    return NextResponse.json({
      verified: result.match,
      similarity: result.similarity,
      error: result.error || null,
    })
  } catch (error) {
    console.error("Error in identity verification:", error)

    // Service errors (network, AWS down) — don't treat as verification failure
    return NextResponse.json(
      {
        verified: false,
        similarity: 0,
        error: "Verification service error. Please try again.",
        serviceError: true,
      },
      { status: 503 }
    )
  }
}
