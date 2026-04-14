import { Package, Shield, Lock, RotateCcw, Truck, ShieldCheck, Heart, Star, Award, CheckCircle, Clock, Gift, CreditCard, Eye, EyeOff, Headphones, ThumbsUp, Zap } from "lucide-react"
import type { ShopSettingsTrustIcon } from "@/lib/get-shop-settings"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Package, Shield, Lock, RotateCcw, Truck, ShieldCheck,
  Heart, Star, Award, CheckCircle, Clock, Gift,
  CreditCard, Eye, EyeOff, Headphones, ThumbsUp, Zap,
}

interface ShopTrustIconsProps {
  enabled: boolean
  items: ShopSettingsTrustIcon[]
}

export function ShopTrustIcons({ enabled, items }: ShopTrustIconsProps) {
  if (!enabled || items.length === 0) return null

  return (
    <section
      className="py-8 border-b"
      style={{ borderColor: "var(--border-color, #e5e7eb)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item, index) => {
            const IconComponent = ICON_MAP[item.icon] || Shield
            return (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 w-12 h-12 flex items-center justify-center"
                  style={{ backgroundColor: "color-mix(in srgb, var(--brand-color, #E03E54) 10%, transparent)" }}
                >
                  <IconComponent
                    className="w-6 h-6"
                    style={{ color: "var(--brand-color, #E03E54)" }}
                  />
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary, #000)" }}
                >
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
