import { NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.MUX_WEBHOOK_SECRET) {
    console.warn("Missing webhook signature or secret")
    return false
  }

  try {
    // Parse mux-signature header: t=timestamp,v1=signature
    const elements = signature.split(",")
    const timestamp = elements.find((e) => e.startsWith("t="))?.split("=")[1]
    const sig = elements.find((e) => e.startsWith("v1="))?.split("=")[1]

    if (!timestamp || !sig) {
      return false
    }

    // Create expected signature
    const payload = `${timestamp}.${body}`
    const expectedSig = crypto
      .createHmac("sha256", process.env.MUX_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex")

    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return false
  }
}

// GET handler for URL validation by Mux
export async function GET() {
  return NextResponse.json({ status: "ok" })
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("mux-signature")

    // Verify signature in production
    if (process.env.NODE_ENV === "production") {
      const isValid = await verifyWebhookSignature(body, signature)
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    const { type, data } = event

    console.log(`[Mux Webhook] Received event: ${type}`)

    switch (type) {
      // Asset ready - video finished processing
      case "video.asset.ready": {
        const assetId = data.id
        const uploadId = data.upload_id as string | undefined
        const playbackId = data.playback_ids?.[0]?.id
        const duration = data.duration

        // Match by assetId first; fall back to uploadId if asset_created
        // hasn't arrived yet (webhook reordering).
        let video = await prisma.video.findFirst({ where: { muxAssetId: assetId } })
        if (!video && uploadId) {
          video = await prisma.video.findFirst({ where: { muxUploadId: uploadId } })
        }

        if (video) {
          await prisma.video.update({
            where: { id: video.id },
            data: {
              muxAssetId: assetId,
              muxPlaybackId: playbackId,
              ...(duration && duration > 0 ? { duration: Math.round(duration) } : {}),
              status: "PUBLISHED",
            },
          })
          console.log(`[Mux Webhook] Video ${video.id} marked as ready`)
        }
        break
      }

      // Asset errored - video processing failed
      case "video.asset.errored": {
        const assetId = data.id
        const uploadId = data.upload_id as string | undefined
        const errorMessage = data.errors?.messages?.join(", ") || "Processing failed"

        let video = await prisma.video.findFirst({ where: { muxAssetId: assetId } })
        if (!video && uploadId) {
          video = await prisma.video.findFirst({ where: { muxUploadId: uploadId } })
        }

        if (video) {
          await prisma.video.update({
            where: { id: video.id },
            data: { status: "DRAFT" },
          })
          console.error(`[Mux Webhook] Video ${video.id} error: ${errorMessage}`)
        }
        break
      }

      // Asset deleted
      case "video.asset.deleted": {
        const assetId = data.id
        console.log(`[Mux Webhook] Asset deleted: ${assetId}`)
        break
      }

      // Upload completed - asset created from direct upload
      case "video.upload.asset_created": {
        const uploadId = data.id
        const assetId = data.asset_id

        // Find video by upload ID and link the asset.
        // Do NOT touch muxPlaybackId/duration: if video.asset.ready
        // arrived first (webhook reordering), those values are already set
        // and resetting them here would wipe them.
        const video = await prisma.video.findFirst({
          where: { muxUploadId: uploadId },
        })

        if (video) {
          await prisma.video.update({
            where: { id: video.id },
            data: { muxAssetId: assetId },
          })
          console.log(`[Mux Webhook] Video ${video.id} asset created: ${assetId}`)
        }
        break
      }

      // Static renditions ready (for downloads)
      case "video.asset.static_renditions.ready": {
        const assetId = data.id
        console.log(`[Mux Webhook] Static renditions ready for asset: ${assetId}`)
        break
      }

      default:
        console.log(`[Mux Webhook] Unhandled event type: ${type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Mux Webhook] Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
