const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

interface GrecaptchaEnterprise {
  ready: (cb: () => void) => void
  execute: (siteKey: string, opts: { action: string }) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: { enterprise: GrecaptchaEnterprise }
  }
}

let loadPromise: Promise<void> | null = null

function loadRecaptchaScript(): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("reCAPTCHA only available in the browser"))
      return
    }
    if (window.grecaptcha?.enterprise) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${SITE_KEY}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null
      reject(new Error("Failed to load reCAPTCHA script"))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

/**
 * Obtiene un token de reCAPTCHA para la acción indicada.
 * Devuelve null si no hay site key configurada o si el script falla
 * (el servidor decide entonces si bloquear o no).
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!SITE_KEY) return null

  try {
    await loadRecaptchaScript()
    const grecaptcha = window.grecaptcha?.enterprise
    if (!grecaptcha) return null

    await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()))
    return await grecaptcha.execute(SITE_KEY, { action })
  } catch (error) {
    console.error("[reCAPTCHA] Could not get token:", error)
    return null
  }
}
