import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sendTemplateEmail, PasswordChangedEmailTemplate } from "@/lib/email"
import { z } from "zod"

const schema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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

    const { token, password } = result.data

    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      })
      return NextResponse.json(
        { error: "The link has expired" },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await hash(password, 12)

    // Update user's password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    })

    // Delete the token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    })

    // Send password changed confirmation email
    await sendTemplateEmail({
      to: resetToken.user.email,
      template: "auth/password-changed",
      react: PasswordChangedEmailTemplate({
        name: resetToken.user.name || "usuario",
        changedAt: new Date(),
      }),
      metadata: { userId: resetToken.userId },
    })

    return NextResponse.json({
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "Error resetting password" },
      { status: 500 }
    )
  }
}
