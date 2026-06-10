import Image from "next/image"
import Link from "next/link"

interface FeaturedCategory {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  description?: string | null
}

interface ShopFeaturedCollectionsProps {
  enabled: boolean
  title: string
  subtitle: string
  categories: FeaturedCategory[]
}

export function ShopFeaturedCollections({ enabled, title, subtitle, categories }: ShopFeaturedCollectionsProps) {
  if (!enabled || categories.length === 0) return null

  return (
    <section className="py-16" id="colecciones">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: "var(--text-primary, #000)" }}
          >
            {title}
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: "var(--text-muted, #6b7280)" }}
          >
            {subtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/tienda/categoria/${category.slug}`}
              className="group relative overflow-hidden h-80"
            >
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-white text-xl font-bold mb-2">{category.name}</h3>
                {category.description && (
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">{category.description}</p>
                )}
                <span
                  className="inline-flex items-center text-sm font-bold px-4 py-2 text-white transition-all group-hover:scale-105"
                  style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
                >
                  View Collection
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
