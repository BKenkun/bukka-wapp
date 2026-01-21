"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface VideoInfoBarProps {
  title: string
  subscriberCount: string
  likePercentage: string
  commentCount: string
  viewCount: string
  videoSlug: string
  videoId?: string
  canDownload?: boolean
  userId?: string | null
}

function WaterDropIcon({ className, filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="29"
      viewBox="0 0 22 29"
      fill={filled ? "#FA4860" : "none"}
      className={className}
    >
      <path
        d="M16.75 5.14597C15.206 3.29906 13.4682 1.63596 11.5688 0.187435C11.4006 0.0654404 11.2003 0 10.995 0C10.7897 0 10.5894 0.0654404 10.4213 0.187435C8.52531 1.63657 6.7909 3.29964 5.25 5.14597C1.81375 9.23319 0 13.5418 0 17.607C0 20.6286 1.15893 23.5265 3.22183 25.6631C5.28473 27.7997 8.08262 29 11 29C13.9174 29 16.7153 27.7997 18.7782 25.6631C20.8411 23.5265 22 20.6286 22 17.607C22 13.5418 20.1863 9.23319 16.75 5.14597ZM11 26.9286C8.61386 26.9258 6.32622 25.9428 4.63896 24.1953C2.95171 22.4478 2.00265 20.0784 2 17.607C2 10.1977 8.93375 4.01314 11 2.33009C13.0662 4.01314 20 10.1951 20 17.607C19.9974 20.0784 19.0483 22.4478 17.361 24.1953C15.6738 25.9428 13.3861 26.9258 11 26.9286ZM17.9862 18.8162C17.7269 20.3164 17.0301 21.6982 15.9896 22.7757C14.949 23.8532 13.6147 24.5746 12.1663 24.8429C12.1113 24.852 12.0557 24.8567 12 24.8571C11.7492 24.857 11.5075 24.7593 11.323 24.5834C11.1384 24.4074 11.0245 24.166 11.0037 23.9071C10.9829 23.6482 11.0569 23.3907 11.2108 23.1856C11.3648 22.9805 11.5876 22.8428 11.835 22.7999C13.9062 22.4387 15.6637 20.6184 16.015 18.4693C16.0594 18.1984 16.2059 17.9568 16.4223 17.7978C16.6387 17.6388 16.9072 17.5753 17.1688 17.6213C17.4303 17.6673 17.6635 17.819 17.8171 18.0431C17.9706 18.2672 18.0319 18.5453 17.9875 18.8162H17.9862Z"
        fill={filled ? "#FA4860" : "white"}
      />
    </svg>
  )
}

export function VideoInfoBar({ title, subscriberCount, likePercentage, commentCount, viewCount, videoSlug, videoId, canDownload = false, userId }: VideoInfoBarProps) {
  const router = useRouter()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(parseInt(subscriberCount.replace(/,/g, "")) || 0)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

  // Check if video is in favorites on mount
  useEffect(() => {
    if (!videoId || !userId) return

    async function checkFavorite() {
      try {
        const res = await fetch(`/api/favorites/check?videoId=${videoId}`)
        if (res.ok) {
          const data = await res.json()
          setIsFavorite(data.isFavorite)
        }
      } catch (error) {
        console.error("Error checking favorite:", error)
      }
    }

    checkFavorite()
  }, [videoId, userId])

  async function handleToggleFavorite() {
    if (!videoId) return

    if (!userId) {
      toast.error("Inicia sesión para guardar en favoritos")
      router.push("/login")
      return
    }

    setIsTogglingFavorite(true)
    try {
      if (isFavorite) {
        // Remove from favorites
        const res = await fetch(`/api/favorites?videoId=${videoId}`, {
          method: "DELETE",
        })
        if (res.ok) {
          setIsFavorite(false)
          setFavoriteCount((prev) => Math.max(0, prev - 1))
          toast.success("Eliminado de favoritos")
        } else {
          throw new Error("Error al eliminar de favoritos")
        }
      } else {
        // Add to favorites
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        })
        if (res.ok) {
          setIsFavorite(true)
          setFavoriteCount((prev) => prev + 1)
          toast.success("Añadido a favoritos")
        } else {
          const data = await res.json()
          throw new Error(data.error || "Error al añadir a favoritos")
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar favoritos")
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  async function handleDownload() {
    if (!canDownload) {
      toast.error("Tu plan no permite descargas. Actualiza tu suscripción para desbloquear esta función.")
      return
    }

    setIsDownloading(true)
    try {
      const res = await fetch(`/api/videos/${videoSlug}/download`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al descargar")
      }

      // Abrir URL de descarga en nueva pestaña
      window.open(data.downloadUrl, "_blank")
      toast.success("Descarga iniciada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al descargar")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="w-full">
      <div
        className="px-4 md:px-6 py-4"
        style={{
          borderRadius: "0 0 5px 5px",
          background: "rgba(126, 126, 126, 0.27)",
        }}
      >
        <div className="flex flex-col md:flex-row gap-4 md:gap-4">
          {/* Left column - Title on top, Subscribe button + count below */}
          <div className="flex flex-col gap-2 flex-1">
            <h1
              className="text-white"
              style={{
                fontSize: "16px",
                fontWeight: 600,
                lineHeight: "24px",
              }}
            >
              {title}
            </h1>
            <div className="flex items-center gap-6 flex-wrap">
              {/* Share button */}
              <button className="flex items-center gap-[15px] text-white font-normal text-base leading-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="0 0 20 19" fill="none">
                  <path
                    d="M15.259 9.49218C15.0497 9.49218 14.8589 9.40908 14.6865 9.24287C14.5142 9.07667 14.428 8.87661 14.428 8.64269C14.428 8.40877 14.508 8.21179 14.6681 8.05174L17.9552 4.74611L14.6681 1.45894C14.508 1.28658 14.428 1.08344 14.428 0.849522C14.428 0.615602 14.5111 0.415541 14.6773 0.249336C14.8435 0.0831318 15.0436 2.86102e-05 15.2775 2.86102e-05C15.5114 2.86102e-05 15.7084 0.0862103 15.8684 0.25857L19.7466 4.15515C19.9189 4.3152 20.0051 4.51219 20.0051 4.74611C20.0051 4.98002 19.9189 5.18316 19.7466 5.35552L15.8684 9.25211C15.6838 9.41216 15.4806 9.49218 15.259 9.49218ZM0.854587 18.4857C0.829964 18.4857 0.805341 18.4857 0.780718 18.4857C0.5468 18.4734 0.352894 18.3749 0.199 18.1902C0.0451067 18.0056 -0.0195286 17.7963 0.00509441 17.5624C0.251324 14.9893 0.845353 12.7547 1.78718 10.8588C2.72901 8.96279 4.01864 7.42385 5.65606 6.24195C7.34274 5.02311 9.34335 4.21056 11.6579 3.80428C13.3323 3.5088 15.0867 3.43493 16.9211 3.58267C17.8937 3.66885 18.7001 3.78581 19.3403 3.93355C19.5742 3.98279 19.7527 4.10591 19.8758 4.30289C19.9989 4.49988 20.0328 4.71225 19.9774 4.94001C19.922 5.16777 19.7958 5.34321 19.5988 5.46633C19.4018 5.58944 19.1864 5.62638 18.9525 5.57713C18.8663 5.55251 18.5954 5.50326 18.1399 5.42939C17.4628 5.3309 16.7672 5.26934 16.0531 5.24472C15.0559 5.19547 14.0833 5.2201 13.1353 5.31859C11.9657 5.4417 10.87 5.66947 9.84812 6.00188C8.65391 6.40816 7.58281 6.94986 6.63483 7.62699C5.20669 8.66116 4.07712 10.0247 3.24609 11.7175C2.41507 13.4103 1.90106 15.4078 1.70408 17.7101C1.67946 17.9317 1.58404 18.1164 1.41784 18.2641C1.25163 18.4118 1.06388 18.4857 0.854587 18.4857Z"
                    fill="white"
                  />
                </svg>
                Compartir
              </button>

              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`flex items-center justify-center gap-5 px-6 py-2 font-normal text-base leading-6 transition-colors ${
                  canDownload
                    ? "text-white hover:opacity-90"
                    : "text-white/50 cursor-not-allowed"
                }`}
                style={{
                  minWidth: "140.55px",
                  background: canDownload ? "#00B1DE" : "#555"
                }}
                title={canDownload ? "Descargar video" : "Actualiza tu plan para descargar"}
              >
                {isDownloading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="0 0 20 19" fill="none">
                    <path
                      d="M9.99077 15.4201C9.76916 15.4201 9.57218 15.334 9.39982 15.1616L3.30563 9.06741C3.14558 8.89505 3.06556 8.69191 3.06556 8.45799C3.06556 8.22407 3.14866 8.02401 3.31487 7.85781C3.48107 7.6916 3.67806 7.6085 3.90582 7.6085C4.13358 7.6085 4.32749 7.69468 4.48753 7.86704L9.99077 13.3703L15.494 7.86704C15.6664 7.69468 15.8695 7.6085 16.1034 7.6085C16.3373 7.6085 16.5374 7.6916 16.7036 7.85781C16.8698 8.02401 16.9529 8.22407 16.9529 8.45799C16.9529 8.69191 16.8667 8.89505 16.6944 9.06741L10.6002 15.1616C10.4278 15.334 10.2247 15.4201 9.99077 15.4201ZM9.99077 15.4201C9.75685 15.4201 9.55679 15.337 9.39058 15.1708C9.22438 15.0046 9.14127 14.8046 9.14127 14.5706V0.849495C9.14127 0.615578 9.22438 0.415516 9.39058 0.24931C9.55679 0.0831051 9.75685 1.90735e-06 9.99077 1.90735e-06C10.2247 1.90735e-06 10.4247 0.0831051 10.591 0.24931C10.7572 0.415516 10.8403 0.615578 10.8403 0.849495V14.5706C10.8403 14.8046 10.7572 15.0046 10.591 15.1708C10.4247 15.337 10.2247 15.4201 9.99077 15.4201ZM19.1505 18.4672H0.849492C0.615574 18.4672 0.415512 18.3841 0.249307 18.2179C0.0831025 18.0517 0 17.8517 0 17.6177C0 17.3838 0.0831025 17.1838 0.249307 17.0175C0.415512 16.8513 0.615574 16.7682 0.849492 16.7682H19.1505C19.3844 16.7682 19.5845 16.8513 19.7507 17.0175C19.9169 17.1838 20 17.3838 20 17.6177C20 17.8517 19.9169 18.0517 19.7507 18.2179C19.5845 18.3841 19.3844 18.4672 19.1505 18.4672Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
                {isDownloading ? "Descargando..." : "Descargar"}
              </button>
            </div>
          </div>

          {/* Right column - 3px line at top (desktop only), stats below with proper gaps */}
          <div className="flex flex-col md:items-end">
            <div className="hidden md:block w-full h-[3px] bg-white" />

            <div className="hidden md:block" style={{ height: "15px" }} />

            <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap items-start sm:items-center md:items-center gap-4 sm:gap-6 md:gap-10 text-white">
              <button
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                className="flex items-center gap-4 hover:opacity-80 transition-opacity disabled:opacity-50"
                title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <WaterDropIcon className="w-[22px] h-[29px]" filled={isFavorite} />
                <span style={{ fontSize: "16px", fontWeight: 400, lineHeight: "24px", color: isFavorite ? "#FA4860" : "white" }}>
                  {favoriteCount.toLocaleString()}
                </span>
              </button>

              <span style={{ fontSize: "16px", fontWeight: 400, lineHeight: "24px" }}>{viewCount} views</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
