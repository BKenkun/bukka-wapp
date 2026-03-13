import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: number
}

export function StarRating({ rating, maxStars = 5, size = 14 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={i}
          style={{
            width: size,
            height: size,
            fill: i < Math.round(rating) ? "#FACC15" : "transparent",
            color: i < Math.round(rating) ? "#FACC15" : "#D1D5DB",
          }}
        />
      ))}
    </div>
  )
}
