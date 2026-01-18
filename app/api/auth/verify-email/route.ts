import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendTemplateEmail, WelcomeEmailTemplate } from "@/lib/email"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Token inválido", request.url)
      )
    }

    // Find the token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Token inválido o expirado", request.url)
      )
    }

    // Check if token has expired
    if (new Date() > verificationToken.expiresAt) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      })
      return NextResponse.redirect(
        new URL("/auth/login?error=El enlace ha expirado", request.url)
      )
    }

    // Verify the user's email
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    })

    // Delete the token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    })

    // Send welcome email
    await sendTemplateEmail({
      to: verificationToken.user.email,
      template: "auth/welcome",
      react: WelcomeEmailTemplate({
        name: verificationToken.user.name || "usuario",
      }),
      metadata: { userId: verificationToken.userId },
    })

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL("/auth/login?verified=true", request.url)
    )
  } catch (error) {
    console.error("Error verifying email:", error)
    return NextResponse.redirect(
      new URL("/auth/login?error=Error al verificar email", request.url)
    )
  }
}
