"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AccountNav } from "@/components/account-nav"
import Link from "next/link"
import Image from "next/image"

interface VideoFavorite {
  id: string
  type: "video"
  createdAt: string
  item: {
    id: string
    slug: string
    title: string
    thumbnailUrl: string
    viewCount: number
    likeCount: number
    duration: number
    performerName: string | null
  }
}

interface PerformerFavorite {
  id: string
  type: "performer"
  createdAt: string
  item: {
    id: string
    slug: string
    name: string
    profileImage: string | null
    videoCount: number
  }
}

type Favorite = VideoFavorite | PerformerFavorite

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K`
  return views.toString()
}

export default function FavoritosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"videos" | "actrices">("videos")
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true)
      try {
        const type = activeTab === "videos" ? "videos" : "performers"
        const res = await fetch(`/api/favorites?type=${type}`)
        if (res.ok) {
          const data = await res.json()
          setFavorites(data.favorites)
        }
      } catch (error) {
        console.error("Error fetching favorites:", error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchFavorites()
    }
  }, [activeTab, session])

  const handleRemoveFavorite = async (favorite: Favorite) => {
    try {
      const param = favorite.type === "video" ? "videoId" : "performerId"
      const res = await fetch(`/api/favorites?${param}=${favorite.item.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.id !== favorite.id))
      }
    } catch (error) {
      console.error("Error removing favorite:", error)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex-1 flex flex-col font-sans bg-black text-white">
        <div className="flex flex-col flex-1 px-4 md:px-8 pt-[120px] pb-12">
          <AccountNav />
          <div className="mt-[50px] text-center">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col font-sans bg-black text-white">
      <div className="flex flex-col flex-1 px-4 md:px-8 pt-[120px] pb-12">
        {/* Account Navigation */}
        <AccountNav />

        {/* Tabs - Videos y Actrices */}
        <div className="mt-[50px] flex gap-8">
          <button
            onClick={() => setActiveTab("videos")}
            className={`font-montserrat text-[22px] font-bold leading-[48px] transition-colors ${
              activeTab === "videos" ? "text-[#FA4860]" : "text-[#6B7280]"
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab("actrices")}
            className={`font-montserrat text-[22px] font-bold leading-[48px] transition-colors ${
              activeTab === "actrices" ? "text-[#FA4860]" : "text-[#6B7280]"
            }`}
          >
            Actrices
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="mt-[30px]">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando favoritos...</div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">
                No tienes {activeTab === "videos" ? "videos" : "actrices"} favoritos todavia
              </p>
              <Link
                href={activeTab === "videos" ? "/videos" : "/modelos"}
                className="text-[#FA4860] hover:underline"
              >
                Explorar {activeTab === "videos" ? "videos" : "modelos"}
              </Link>
            </div>
          ) : activeTab === "videos" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(favorites as VideoFavorite[]).map((fav) => (
                <div key={fav.id} className="relative group">
                  <Link href={`/videos/${fav.item.slug}`}>
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={fav.item.thumbnailUrl || "/placeholder.jpg"}
                        alt={fav.item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs text-white">
                        {formatDuration(fav.item.duration)}
                      </div>
                    </div>
                    <h3 className="mt-2 text-white font-medium truncate">{fav.item.title}</h3>
                    {fav.item.performerName && (
                      <p className="text-gray-400 text-sm">{fav.item.performerName}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{formatViews(fav.item.viewCount)} vistas</span>
                      <span>{Math.round((fav.item.likeCount / Math.max(fav.item.viewCount, 1)) * 100)}% likes</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(fav)}
                    className="absolute top-2 right-2 bg-red-500/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar de favoritos"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {(favorites as PerformerFavorite[]).map((fav) => (
                <div key={fav.id} className="relative group">
                  <Link href={`/modelos/${fav.item.slug}`}>
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image
                        src={fav.item.profileImage || "/placeholder.jpg"}
                        alt={fav.item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h3 className="mt-2 text-white font-medium text-center">{fav.item.name}</h3>
                    <p className="text-gray-400 text-sm text-center">{fav.item.videoCount} videos</p>
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(fav)}
                    className="absolute top-2 right-2 bg-red-500/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar de favoritos"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
