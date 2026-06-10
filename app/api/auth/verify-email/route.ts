import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendTemplateEmail, WelcomeEmailTemplate } from "@/lib/email"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(
        new URL("/?login=true&error=Invalid token", APP_URL)
      )
    }

    // Find the token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/?login=true&error=Invalid or expired token", APP_URL)
      )
    }

    // Check if token has expired
    if (new Date() > verificationToken.expiresAt) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      })
      return NextResponse.redirect(
        new URL("/?login=true&error=The link has expired", APP_URL)
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
    // ("email-verified": el parámetro "verified" lo usan los filtros de /performers)
    return NextResponse.redirect(
      new URL("/?login=true&email-verified=true", APP_URL)
    )
  } catch (error) {
    console.error("Error verifying email:", error)
    return NextResponse.redirect(
      new URL("/?login=true&error=Error verifying email", APP_URL)
    )
  }
}
