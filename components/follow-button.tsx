"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface FollowButtonProps {
  performerId: string
  initialIsFollowing?: boolean
}

export function FollowButton({ performerId, initialIsFollowing = false }: FollowButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing)
  const [loading, setLoading] = React.useState(false)
  const [checkingStatus, setCheckingStatus] = React.useState(true)

  // Check if user is already following this performer
  React.useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session?.user) {
        setCheckingStatus(false)
        return
      }

      try {
        const res = await fetch(`/api/favorites/check?performerId=${performerId}`)
        if (res.ok) {
          const data = await res.json()
          setIsFollowing(data.isFavorite)
        }
      } catch (error) {
        console.error("Error checking follow status:", error)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkFollowStatus()
  }, [performerId, session])

  const handleToggleFollow = async () => {
    if (!session?.user) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    setLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        const res = await fetch(`/api/favorites?performerId=${performerId}`, {
          method: "DELETE",
        })
        if (res.ok) {
          setIsFollowing(false)
          toast.success("Unfollowed successfully")
        } else {
          toast.error("Error unfollowing")
        }
      } else {
        // Follow
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ performerId }),
        })
        if (res.ok) {
          setIsFollowing(true)
          toast.success("Now following this performer")
        } else if (res.status === 409) {
          setIsFollowing(true)
        } else {
          toast.error("Error following")
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
      toast.error("Error processing request")
    } finally {
      setLoading(false)
    }
  }

  // Skeleton while checking status
  if (checkingStatus) {
    return (
      <div
        className="animate-pulse"
        style={{
          padding: "10px 14px",
          background: "color-mix(in srgb, var(--text-primary) 10%, transparent)",
          width: "140px",
          height: "44px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--text-primary) 30%, transparent)" }} />
        <div className="w-16 h-4" style={{ backgroundColor: "color-mix(in srgb, var(--text-primary) 30%, transparent)" }} />
      </div>
    )
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className="btn-primary flex items-center gap-3.5"
      style={{ cursor: loading ? "wait" : "pointer" }}
    >
      {/* Heart icon - outline when not following, filled white when following */}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none">
        <path
          d="M1.4875 8.07028L7.13438 13.3422C7.36875 13.5609 7.67812 13.6828 8 13.6828C8.32187 13.6828 8.63125 13.5609 8.86563 13.3422L14.5125 8.07028C15.4625 7.18591 16 5.94528 16 4.64841V4.46716C16 2.28278 14.4219 0.420285 12.2688 0.0609095C10.8438 -0.17659 9.39375 0.289035 8.375 1.30778L8 1.68278L7.625 1.30778C6.60625 0.289035 5.15625 -0.17659 3.73125 0.0609095C1.57812 0.420285 0 2.28278 0 4.46716V4.64841C0 5.94528 0.5375 7.18591 1.4875 8.07028Z"
          fill={isFollowing ? "var(--btn-primary-text)" : "none"}
          stroke="var(--btn-primary-text)"
          strokeWidth={isFollowing ? 0 : 1.5}
        />
      </svg>
      <span>
        {loading ? "..." : isFollowing ? "Following" : "Follow"}
      </span>
    </button>
  )
}
