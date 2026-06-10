import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { validateReferralCode } from "@/lib/referral-codes"

const schema = z.object({
  code: z.string().min(1),
  context: z.enum(["shop", "subscription"]),
  amount: z.number().min(0).default(0),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid data" },
      { status: 400 },
    )
  }

  const result = await validateReferralCode(
    parsed.data.code,
    parsed.data.context,
    parsed.data.amount,
  )

  if (!result.ok || !result.referral) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 200 })
  }

  return NextResponse.json({
    valid: true,
    code: result.referral.code,
    discountPercent: result.referral.discountPercent,
    discountAmount: result.discountAmount ?? 0,
    label: result.referral.label,
    owner: result.referral.owner,
  })
}
