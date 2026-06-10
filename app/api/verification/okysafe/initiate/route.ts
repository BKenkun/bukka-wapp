import { NextRequest, NextResponse } from "next/server"
import { createEmailCheckRequest } from "@/lib/okysafe"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      )
    }

    const result = await createEmailCheckRequest(email)

    if (result.isVisitorVerified) {
      return NextResponse.json({ alreadyVerified: true })
    }

    if (!result.verificationUrl) {
      return NextResponse.json(
        { error: "Verification could not be started" },
        { status: 502 }
      )
    }

    return NextResponse.json({ verificationUrl: result.verificationUrl })
  } catch (error) {
    console.error("[OkySafe] Error initiating verification:", error)
    return NextResponse.json(
      { error: "Error starting age verification" },
      { status: 500 }
    )
  }
}
