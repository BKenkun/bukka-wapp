import type { ShopSettingsReviewItem } from "@/lib/get-shop-settings"
import { StarRating } from "./star-rating"

interface ShopReviewsProps {
  enabled: boolean
  title: string
  items: ShopSettingsReviewItem[]
}

export function ShopReviews({ enabled, title, items }: ShopReviewsProps) {
  if (!enabled || items.length === 0) return null

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: "var(--text-primary, #000)" }}
          >
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const initials = item.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            return (
              <div
                key={index}
                className="p-8 border transition-shadow hover:shadow-lg"
                style={{ borderColor: "var(--border-color, #e5e7eb)" }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 flex items-center justify-center text-white font-bold text-lg"
                    style={{
                      background: `linear-gradient(135deg, var(--brand-color, #E03E54), #a855f7)`,
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p
                      className="font-bold"
                      style={{ color: "var(--text-primary, #000)" }}
                    >
                      {item.name}
                    </p>
                    <StarRating rating={item.rating} size={14} />
                  </div>
                </div>
                <p
                  className="leading-relaxed"
                  style={{ color: "var(--text-muted, #6b7280)" }}
                >
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
