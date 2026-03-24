import { NextRequest, NextResponse } from "next/server"
import { verifyCallbackToken } from "@/lib/okysafe"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const COOKIE_NAME = "age-verified"
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

export async function GET(request: NextRequest) {
  const resultToken = request.nextUrl.searchParams.get("result-token")
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin

  if (!resultToken) {
    return NextResponse.redirect(new URL("/?av=error", baseUrl))
  }

  try {
    const { isVerified } = await verifyCallbackToken(resultToken)

    if (!isVerified) {
      return NextResponse.redirect(new URL("/?av=failed", baseUrl))
    }

    // Success: set secure HttpOnly cookie
    const response = NextResponse.redirect(new URL("/?av=success", baseUrl))

    response.cookies.set(COOKIE_NAME, "true", {
      httpOnly: true,
      secure: true,
      sameSite: "lax", // Required: redirect comes from external domain (OkySafe)
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    // If user is logged in, also update database
    try {
      const session = await auth()
      if (session?.user?.id) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            ageVerified: true,
            ageVerifiedAt: new Date(),
          },
        })
      }
    } catch {
      // Non-critical: cookie is already set for anonymous flow
      console.error("[OkySafe] Failed to update user record")
    }

    return response
  } catch (error) {
    console.error("[OkySafe] Callback verification error:", error)
    return NextResponse.redirect(new URL("/?av=error", baseUrl))
  }
}
