import Link from "next/link"
import type { ShopSettingsHero } from "@/lib/get-shop-settings"

interface ShopHeroProps {
  hero: ShopSettingsHero
}

export function ShopHero({ hero }: ShopHeroProps) {
  if (!hero.enabled) return null

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: hero.backgroundImageUrl
          ? undefined
          : `linear-gradient(135deg, var(--brand-color, #E03E54) 0%, #000 100%)`,
      }}
    >
      {hero.backgroundImageUrl && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${hero.backgroundImageUrl})` }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </>
      )}
      <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          {hero.badgeText && (
            <span
              className="inline-block text-xs font-bold px-4 py-1.5 mb-6 tracking-wider"
              style={{
                backgroundColor: "var(--brand-color, #E03E54)",
                color: "#fff",
              }}
            >
              {hero.badgeText}
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {hero.title}
          </h1>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            {hero.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            {hero.ctaPrimaryText && (
              <Link
                href={hero.ctaPrimaryUrl}
                className="inline-flex items-center px-8 py-4 text-white font-bold text-lg transition-all hover:opacity-90 hover:scale-105"
                style={{ backgroundColor: "var(--brand-color, #E03E54)" }}
              >
                {hero.ctaPrimaryText}
              </Link>
            )}
            {hero.ctaSecondaryText && (
              <Link
                href={hero.ctaSecondaryUrl}
                className="inline-flex items-center px-8 py-4 text-white font-bold text-lg border-2 border-white/30 transition-all hover:bg-white/10 hover:scale-105"
              >
                {hero.ctaSecondaryText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
