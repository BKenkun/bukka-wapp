import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendTemplateEmail, ResetPasswordEmailTemplate } from "@/lib/email"
import { randomBytes } from "crypto"
import { z } from "zod"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const schema = z.object({
  email: z.string().email("Invalid email"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = result.data

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: "If the email exists, you will receive a link to reset your password",
      })
    }

    // Delete any existing password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Generate a new token
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Create the token
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Send password reset email
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

    await sendTemplateEmail({
      to: user.email,
      template: "auth/reset-password",
      react: ResetPasswordEmailTemplate({
        name: user.name || "usuario",
        resetUrl,
      }),
      metadata: { userId: user.id },
    })

    return NextResponse.json({
      message: "If the email exists, you will receive a link to reset your password",
    })
  } catch (error) {
    console.error("Error in forgot password:", error)
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    )
  }
}
