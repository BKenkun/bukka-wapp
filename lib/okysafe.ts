import { jwtVerify } from "jose"

// ─── Types ───────────────────────────────────────────────────────────

interface OkySafeConfig {
  secret: string
  clientId: string
  apiUrl: string
  baseUrl: string
}

interface EmailCheckResponse {
  checkRequestId: string
  isVisitorVerified: boolean
  verificationUrl?: string
}

interface OkySafeJwtPayload {
  isVerified: boolean
}

// ─── Config ──────────────────────────────────────────────────────────

export function getOkySafeConfig(): OkySafeConfig {
  const secret = process.env.OKYSAFE_SECRET || ""
  const clientId = process.env.OKYSAFE_CLIENT_ID || ""

  if (!secret || !clientId) {
    throw new Error(
      "OKYSAFE_SECRET and OKYSAFE_CLIENT_ID must be configured in environment variables"
    )
  }

  return {
    secret,
    clientId,
    apiUrl: "https://api.okysafe.com/v1",
    baseUrl:
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://bukkakery.com",
  }
}

// ─── API Functions ───────────────────────────────────────────────────

/**
 * Creates an email check request with OkySafe.
 * Returns a verificationUrl to redirect the user to.
 */
export async function createEmailCheckRequest(
  email: string
): Promise<EmailCheckResponse> {
  const config = getOkySafeConfig()

  const response = await fetch(`${config.apiUrl}/email-check-requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      callbackUrl: `${config.baseUrl}/verificacion/callback`,
      clientId: config.clientId,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OkySafe API error (${response.status}): ${text}`)
  }

  return response.json()
}

/**
 * Verifies the callback JWT token from OkySafe.
 * The token is signed with our secret using HS256.
 */
export async function verifyCallbackToken(
  token: string
): Promise<OkySafeJwtPayload> {
  const config = getOkySafeConfig()
  const secret = new TextEncoder().encode(config.secret)

  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  })

  return { isVerified: payload.isVerified as boolean }
}
