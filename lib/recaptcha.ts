const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

// Score mínimo aceptado (0.0 = bot, 1.0 = humano)
const MIN_SCORE = 0.5

export interface RecaptchaResult {
  success: boolean
  score?: number
  reason?: string
}

/**
 * Verifica un token de reCAPTCHA en el servidor.
 * Si RECAPTCHA_SECRET_KEY no está configurada, la verificación se omite
 * (permite desarrollo local sin claves).
 */
export async function verifyRecaptcha(
  token: string | null | undefined,
  expectedAction?: string
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY

  if (!secret) {
    return { success: true, reason: "not_configured" }
  }

  if (!token) {
    return { success: false, reason: "missing_token" }
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    })

    const data = (await response.json()) as {
      success: boolean
      score?: number
      action?: string
      "error-codes"?: string[]
    }

    if (!data.success) {
      return { success: false, reason: (data["error-codes"] || []).join(",") || "invalid_token" }
    }

    if (typeof data.score === "number" && data.score < MIN_SCORE) {
      return { success: false, score: data.score, reason: "low_score" }
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      return { success: false, score: data.score, reason: "action_mismatch" }
    }

    return { success: true, score: data.score }
  } catch (error) {
    // Fail-open: si Google no responde no bloqueamos los registros legítimos
    console.error("[reCAPTCHA] Verification request failed:", error)
    return { success: true, reason: "verify_unavailable" }
  }
}
