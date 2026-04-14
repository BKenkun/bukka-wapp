"use client"

import { ChevronDown } from "lucide-react"
import type { ShopSettingsFaqItem } from "@/lib/get-shop-settings"

interface ShopFaqProps {
  enabled: boolean
  title: string
  items: ShopSettingsFaqItem[]
  bgColor?: string
  titleColor?: string
}

export function ShopFaq({ enabled, title, items, bgColor, titleColor }: ShopFaqProps) {
  if (!enabled || items.length === 0) return null

  return (
    <section
      className="py-16"
      style={{ backgroundColor: bgColor || "var(--surface-bg, #f9fafb)" }}
    >
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: titleColor || "var(--text-primary, #000)" }}
          >
            {title}
          </h2>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => (
            <details
              key={index}
              className="group border overflow-hidden transition-colors"
              style={{
                borderColor: "var(--border-color, #e5e7eb)",
                backgroundColor: "var(--global-bg, #fff)",
              }}
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <span
                  className="font-bold text-lg pr-4"
                  style={{ color: "var(--text-primary, #000)" }}
                >
                  {item.question}
                </span>
                <ChevronDown
                  className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-open:rotate-180"
                  style={{ color: "var(--text-muted, #6b7280)" }}
                />
              </summary>
              <div
                className="px-6 pb-6 leading-relaxed"
                style={{ color: "var(--text-muted, #6b7280)" }}
              >
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
