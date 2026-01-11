import Link from "next/link"
import { Eye, ThumbsUp, CheckCircle, MoreHorizontal } from "lucide-react"

interface VideoCardProps {
  title: string
  subtitle: string
  views: string
  likes: string
  imageUrl: string
  isVerified?: boolean
  variant?: "overlay" | "below"
  slug?: string
}

export function VideoCard({
  title,
  subtitle,
  views,
  likes,
  imageUrl,
  isVerified = true,
  variant = "overlay",
  slug = "video-ejemplo",
}: VideoCardProps) {
  const CardContent = () => {
    if (variant === "below") {
      return (
        <div className="group cursor-pointer">
          {/* Video thumbnail */}
          <div className="relative w-full aspect-[476/309] overflow-hidden rounded-sm mb-3">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* Content below */}
          <div className="flex flex-col">
            {/* Title */}
            <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-1">{title}</h3>

            {/* Subtitle/Author */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/60 text-sm">{subtitle}</span>
              {isVerified && <CheckCircle className="w-4 h-4 text-white/60 flex-shrink-0" />}
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>{views}</span>
                </div>
                <span className="text-white/40">•</span>
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{likes}</span>
                </div>
              </div>

              <button className="text-white/60 hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="relative group cursor-pointer overflow-hidden">
        {/* Video thumbnail */}
        <div className="relative w-full aspect-[476/309]">
          <img src={imageUrl || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />

          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content overlay */}
          <div className="absolute inset-0 p-4 flex flex-col justify-end">
            {/* Title */}
            <h3 className="text-white font-bold text-lg leading-tight mb-2">{title}</h3>

            {/* Subtitle with verified badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white/90 text-sm">{subtitle}</span>
              {isVerified && <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-white text-sm">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{views}</span>
              </div>
              <span className="text-white/60">•</span>
              <div className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4" />
                <span>{likes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/videos/${slug}`}>
      <CardContent />
    </Link>
  )
}
