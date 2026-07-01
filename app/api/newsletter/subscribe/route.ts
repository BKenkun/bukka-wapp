import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { upsertMailjetContact } from "@/lib/email/mailjet"
import { verifyRecaptcha } from "@/lib/recaptcha"
import { z } from "zod"

const subscribeSchema = z.object({
  email: z.string().email("Invalid email"),
  source: z.string().max(50).optional(),
  recaptchaToken: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = subscribeSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 })
    }

    // Anti-spam: verificar reCAPTCHA antes de dar de alta
    const captcha = await verifyRecaptcha(result.data.recaptchaToken, "NEWSLETTER")
    if (!captcha.success) {
      console.warn(`[Newsletter] reCAPTCHA rejected (${captcha.reason}, score: ${captcha.score ?? "n/a"})`)
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 400 }
      )
    }

    const email = result.data.email.toLowerCase().trim()
    const source = result.data.source || "footer"

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, source, isActive: true, confirmedAt: new Date() },
      update: { isActive: true, unsubscribedAt: null },
    })

    // Alta best-effort en Mailjet (si está configurado); no bloquea la respuesta
    upsertMailjetContact(email).catch(() => {})

    return NextResponse.json({ message: "You're subscribed! Thanks for joining." })
  } catch (error) {
    console.error("[Newsletter] Subscribe error:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
