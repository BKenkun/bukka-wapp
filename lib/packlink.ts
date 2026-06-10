// Cliente mínimo de Packlink PRO (https://pro.packlink.es)
// Documentación no oficial: https://www.aftership.com/carriers/packlink/api
//
// Env:
//   PACKLINK_API_KEY        — clave API (Configuración > Packlink PRO clave de API)
//   PACKLINK_FROM_ZIP       — CP de origen (default 28046, Madrid)
//   PACKLINK_FROM_COUNTRY   — país de origen (default ES)

const PACKLINK_API_URL = "https://api.packlink.com/v1"

export function isPacklinkConfigured(): boolean {
  return Boolean(process.env.PACKLINK_API_KEY)
}

function headers(): Record<string, string> {
  return {
    Authorization: process.env.PACKLINK_API_KEY || "",
    "Content-Type": "application/json",
  }
}

export interface PacklinkPackage {
  weight: number // kg
  length: number // cm
  width: number // cm
  height: number // cm
}

export const DEFAULT_PACKAGE: PacklinkPackage = {
  weight: 1,
  length: 30,
  width: 20,
  height: 10,
}

export interface PacklinkRate {
  id: number
  carrierName: string
  serviceName: string
  basePrice: number
  totalPrice: number
  currency: string
  transitTime: string | null
}

interface RawService {
  id: number
  carrier_name?: string
  name?: string
  base_price?: number
  total_price?: number
  price?: { base_price?: number; total_price?: number; currency?: string }
  currency?: string
  transit_time?: string
}

/**
 * Obtiene tarifas disponibles para un envío origen → destino.
 */
export async function getPacklinkRates(params: {
  toZip: string
  toCountry: string
  packages?: PacklinkPackage[]
}): Promise<PacklinkRate[]> {
  const fromZip = process.env.PACKLINK_FROM_ZIP || "28046"
  const fromCountry = process.env.PACKLINK_FROM_COUNTRY || "ES"
  const packages = params.packages?.length ? params.packages : [DEFAULT_PACKAGE]

  const response = await fetch(`${PACKLINK_API_URL}/services`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      from: { country: fromCountry, zip: fromZip },
      to: { country: params.toCountry, zip: params.toZip },
      packages: Object.fromEntries(packages.map((p, i) => [String(i), p])),
    }),
  }).catch(() => null)

  // Fallback: algunas cuentas usan GET /v1/services con query params
  let data: RawService[] | null = null
  if (response?.ok) {
    data = (await response.json().catch(() => null)) as RawService[] | null
  }
  if (!data) {
    const qs = new URLSearchParams({
      "from[country]": fromCountry,
      "from[zip]": fromZip,
      "to[country]": params.toCountry,
      "to[zip]": params.toZip,
      "packages[0][weight]": String(packages[0].weight),
      "packages[0][length]": String(packages[0].length),
      "packages[0][width]": String(packages[0].width),
      "packages[0][height]": String(packages[0].height),
    })
    const getResponse = await fetch(`${PACKLINK_API_URL}/services?${qs}`, {
      headers: headers(),
    })
    if (!getResponse.ok) {
      throw new Error(`Packlink rates failed (HTTP ${getResponse.status})`)
    }
    data = (await getResponse.json()) as RawService[]
  }

  if (!Array.isArray(data)) return []

  return data.map((s) => ({
    id: s.id,
    carrierName: s.carrier_name || "",
    serviceName: s.name || "",
    basePrice: Number(s.price?.base_price ?? s.base_price ?? 0),
    totalPrice: Number(s.price?.total_price ?? s.total_price ?? 0),
    currency: s.price?.currency || s.currency || "EUR",
    transitTime: s.transit_time || null,
  }))
}

export interface PacklinkDraftInput {
  serviceId: number
  to: {
    name: string
    surname: string
    street: string
    city: string
    zip: string
    country: string
    email: string
    phone: string
  }
  from?: {
    name: string
    surname: string
    street: string
    city: string
    zip: string
    country: string
    email: string
    phone: string
  }
  packages?: PacklinkPackage[]
  content: string
  contentValue: number
  source?: string
}

/**
 * Crea un borrador de envío en Packlink PRO. El borrador aparece en el panel
 * de Packlink, donde se completa el pago y se genera la etiqueta.
 * Devuelve la referencia del envío (shipment_reference).
 */
export async function createPacklinkDraft(input: PacklinkDraftInput): Promise<string> {
  const fromZip = process.env.PACKLINK_FROM_ZIP || "28046"
  const fromCountry = process.env.PACKLINK_FROM_COUNTRY || "ES"
  const packages = input.packages?.length ? input.packages : [DEFAULT_PACKAGE]

  const body = {
    service_id: input.serviceId,
    content: input.content,
    contentvalue: input.contentValue,
    source: input.source || "shop",
    from: input.from ?? {
      country: fromCountry,
      zip: fromZip,
      name: "BUKKAKERY",
      surname: "-",
      street1: "PSO. CASTELLANA, 190 - BAJO 3",
      city: "Madrid",
      email: process.env.EMAIL_REPLY_TO || "soporte@bukkakery.com",
      phone: "623996243",
    },
    to: {
      country: input.to.country,
      zip: input.to.zip,
      name: input.to.name,
      surname: input.to.surname || "-",
      street1: input.to.street,
      city: input.to.city,
      email: input.to.email,
      phone: input.to.phone,
    },
    packages: Object.fromEntries(packages.map((p, i) => [String(i), p])),
  }

  const response = await fetch(`${PACKLINK_API_URL}/shipments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  })

  const data = (await response.json().catch(() => null)) as {
    reference?: string
    shipment_reference?: string
    messages?: Array<{ message?: string }>
  } | null

  if (!response.ok) {
    const message = data?.messages?.map((m) => m.message).join(", ")
    throw new Error(message || `Packlink draft failed (HTTP ${response.status})`)
  }

  const reference = data?.reference || data?.shipment_reference
  if (!reference) {
    throw new Error("Packlink did not return a shipment reference")
  }
  return reference
}

/**
 * Recupera las URLs de etiquetas (PDF) de un envío ya pagado.
 */
export async function getPacklinkLabels(shipmentReference: string): Promise<string[]> {
  const response = await fetch(
    `${PACKLINK_API_URL}/shipments/${encodeURIComponent(shipmentReference)}/labels`,
    { headers: headers() }
  )
  if (!response.ok) {
    throw new Error(`Packlink labels failed (HTTP ${response.status})`)
  }
  const data = (await response.json().catch(() => null)) as string[] | null
  return Array.isArray(data) ? data : []
}
