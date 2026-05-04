import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeCode } from "@/lib/referral-codes"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const code = typeof (body as { code?: unknown })?.code === "string"
    ? normalizeCode((body as { code: string }).code)
    : ""

  if (!code) return NextResponse.json({ ok: false }, { status: 400 })

  const updated = await prisma.referralCode.updateMany({
    where: { code, isActive: true },
    data: { totalClicks: { increment: 1 } },
  })

  return NextResponse.json({ ok: updated.count > 0 })
}
