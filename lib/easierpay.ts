// ─── Types ───────────────────────────────────────────────────────────

interface EasierPayConfig {
  bearerToken: string
  commerce: string
  currency: string
  testMode: boolean
  apiUrl: string
  baseUrl: string
}

interface EasierPayProduct {
  id: string
  amount: number
  description?: string
  channel?: string
  rebill_amount?: number // Set for recurring subscriptions
}

interface EasierPayUser {
  id: number // Must be numeric per EasierPay docs (example: 654321)
  name: string
  email: string
  ip?: string
}

interface InitTransactionParams {
  id: number // Must be integer per EasierPay docs
  product: EasierPayProduct
  user: EasierPayUser
  vat?: number
  cart?: object | null
  custom?: object | null
  success_url: string
  fail_url: string
  notification_url: string
}

interface EasierPayAuthResponse {
  result: "OK" | "KO"
  message: string
  transactionId?: number
  "pay-link"?: string
}

interface EasierPayStatusResponse {
  status: number
  transactionStatus:
    | "auth"
    | "pending"
    | "waiting"
    | "3dsecure"
    | "paid"
    | "rejected"
    | "refunded"
    | "chargeback"
    | "fraud"
    | "error"
  transactionStatusReason?: string
  info?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Generates a numeric transaction ID from a timestamp.
 * EasierPay requires `id` to be an integer.
 */
export function generateTransactionId(): number {
  return Date.now()
}

/**
 * Converts a cuid string to a numeric hash for EasierPay user.id.
 * EasierPay expects user.id to be numeric.
 */
export function stringToNumericId(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// ─── Config ──────────────────────────────────────────────────────────

/**
 * All EasierPay configuration is read from environment variables.
 *
 * Required env vars:
 *   EASIERPAY_BEARER_TOKEN  - JWT token from EasierPay (sandbox or production)
 *
 * Optional env vars (with defaults):
 *   EASIERPAY_API_URL       - API base URL (default: https://www.easierpay.io/api)
 *   EASIERPAY_COMMERCE      - Domain without https (default: bukkakery.com)
 *   EASIERPAY_CURRENCY      - USD or EUR (default: EUR)
 *   EASIERPAY_TEST_MODE     - "true" or "false" (default: true)
 *   NEXT_PUBLIC_BASE_URL    - Your site URL for callbacks (default: https://bukkakery.com)
 */
export function getEasierPayConfig(): EasierPayConfig {
  const bearerToken = process.env.EASIERPAY_BEARER_TOKEN || ""

  if (!bearerToken) {
    throw new Error("EASIERPAY_BEARER_TOKEN not configured in environment variables")
  }

  return {
    bearerToken,
    commerce: process.env.EASIERPAY_COMMERCE || "bukkakery.com",
    currency: process.env.EASIERPAY_CURRENCY || "EUR",
    testMode: process.env.EASIERPAY_TEST_MODE !== "false", // true by default
    apiUrl: process.env.EASIERPAY_API_URL || "https://www.easierpay.io/api",
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://bukkakery.com",
  }
}

// ─── API Functions ───────────────────────────────────────────────────

/**
 * Initiates a transaction with EasierPay (one-time or subscription).
 * Returns the pay-link for redirecting the user.
 */
export async function initTransaction(
  params: InitTransactionParams
): Promise<EasierPayAuthResponse> {
  const config = getEasierPayConfig()

  const payload: Record<string, unknown> = {
    commerce: config.commerce,
    id: params.id,
    product: params.product,
    currency: config.currency,
    vat: params.vat ?? 0,
    user: params.user,
    cart: params.cart || null,
    custom: params.custom || null,
    success_url: params.success_url,
    fail_url: params.fail_url,
    notification_url: params.notification_url,
  }

  if (config.testMode) {
    payload.testmode = "y"
  }

  const response = await fetch(`${config.apiUrl}/auth/index.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.bearerToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`EasierPay API error (${response.status}): ${text}`)
  }

  const data: EasierPayAuthResponse = await response.json()
  return data
}

/**
 * Checks the status of a transaction.
 */
export async function getTransactionStatus(
  transactionId: number | string
): Promise<EasierPayStatusResponse> {
  const config = getEasierPayConfig()

  const response = await fetch(`${config.apiUrl}/transaction/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.bearerToken}`,
    },
    body: JSON.stringify({ transaction: transactionId }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `EasierPay status check error (${response.status}): ${text}`
    )
  }

  return response.json()
}
