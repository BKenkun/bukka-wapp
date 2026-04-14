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
  const [activeTab, setActiveTab] = useState<"videos" | "performers">("videos")
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/?login=true")
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
      <div className="flex-1 flex flex-col font-sans" style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}>
        <div className="flex flex-col flex-1 pt-8 pb-12">
          <AccountNav />
          <div className="mt-8 text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col font-sans" style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}>
      <div className="flex flex-col flex-1 pt-8 pb-12">
        {/* Account Navigation */}
        <AccountNav />

        {/* Tabs - Videos and Performers */}
        <div className="mt-8 flex gap-8">
          <button
            onClick={() => setActiveTab("videos")}
            className="font-montserrat text-[22px] font-bold leading-[48px] transition-colors"
            style={{ color: activeTab === "videos" ? "var(--accent-color)" : "var(--text-muted)" }}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab("performers")}
            className="font-montserrat text-[22px] font-bold leading-[48px] transition-colors"
            style={{ color: activeTab === "performers" ? "var(--accent-color)" : "var(--text-muted)" }}
          >
            Performers
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="mt-[30px]">
          {loading ? (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Loading favorites...</div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "var(--text-muted)" }}>
                You have no favorite {activeTab === "videos" ? "videos" : "performers"} yet
              </p>
              <Link
                href={activeTab === "videos" ? "/videos" : "/performers"}
                className="hover:underline"
                style={{ color: "var(--accent-color)" }}
              >
                Browse {activeTab === "videos" ? "videos" : "performers"}
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
                      {fav.item.duration > 0 && (
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs text-white">
                          {formatDuration(fav.item.duration)}
                        </div>
                      )}
                    </div>
                    <h3 className="mt-2 font-medium truncate" style={{ color: "var(--text-primary)" }}>{fav.item.title}</h3>
                    {fav.item.performerName && (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{fav.item.performerName}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                      <span>{formatViews(fav.item.viewCount)} views</span>
                      {fav.item.likeCount > 0 && <span>{fav.item.likeCount} likes</span>}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(fav)}
                    className="absolute top-2 right-2 bg-red-500/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from favorites"
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
                    <h3 className="mt-2 font-medium text-center" style={{ color: "var(--text-primary)" }}>{fav.item.name}</h3>
                    <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>{fav.item.videoCount} videos</p>
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(fav)}
                    className="absolute top-2 right-2 bg-red-500/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from favorites"
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
