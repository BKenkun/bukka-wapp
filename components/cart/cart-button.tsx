"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"

interface CartItem {
  id: string
  quantity: number
  variantId: string | null
  variantLabel: string | null
  product: {
    id: string
    slug: string
    name: string
    price: number
    imageUrl: string | null
    available: boolean
    productType: "SIMPLE" | "VARIABLE"
  }
}

interface CartData {
  id: string
  items: CartItem[]
  itemCount: number
  subtotal: number
  discount: number
  discountPercent: number
  total: number
}

export function CartButton() {
  const [cart, setCart] = useState<CartData | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isEmpty = !cart || cart.items.length === 0

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart")
      if (res.ok) {
        const data = await res.json()
        setCart(data.cart)
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCart()
    }

    window.addEventListener("cart-updated", handleCartUpdate)
    return () => window.removeEventListener("cart-updated", handleCartUpdate)
  }, [])

  const handleRemoveItem = async (itemId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setCart((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((item) => item.id !== itemId),
                itemCount: prev.itemCount - 1,
              }
            : null
        )
      }
    } catch (error) {
      console.error("Error removing item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  const handleClick = () => {
    // Only toggle on click if cart has items
    if (!isEmpty) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div
      className="relative"
      onMouseEnter={isEmpty ? handleMouseEnter : undefined}
      onMouseLeave={isEmpty ? handleMouseLeave : undefined}
    >
      <button
        onClick={handleClick}
        className={`relative p-1 hover:opacity-80 transition-opacity ${isEmpty ? "cursor-default" : "cursor-pointer"}`}
        style={{ color: "var(--header-nav-text)" }}
        aria-label="Shopping cart"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {cart && cart.itemCount > 0 && (
          <span className="absolute -top-1 -right-1 text-xs font-bold w-5 h-5 flex items-center justify-center" style={{ backgroundColor: "var(--brand-color)", color: "var(--text-primary)" }}>
            {cart.itemCount > 9 ? "9+" : cart.itemCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay - only for non-empty cart */}
          {!isEmpty && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
          )}

          <div
            className="absolute right-0 top-full mt-2 shadow-xl z-50"
            style={{ backgroundColor: "var(--surface-bg)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border-color)", width: isEmpty ? "200px" : "350px" }}
            onMouseEnter={isEmpty ? handleMouseEnter : undefined}
            onMouseLeave={isEmpty ? handleMouseLeave : undefined}
          >
            <div className="p-4">
              {isEmpty ? (
                // Empty cart state - simple message
                <div className="text-center py-2">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Your cart is empty</p>
                </div>
              ) : (
                // Cart with items
                <>
                  <h3 className="font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
                    Your Cart ({cart?.itemCount || 0})
                  </h3>

                  <div className="max-h-[300px] overflow-y-auto space-y-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className={`flex gap-3 ${!item.product.available ? "opacity-50" : ""}`}>
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={item.product.imageUrl || "/placeholder.jpg"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {item.product.name}
                          </h4>
                          {item.variantLabel && (
                            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                              {item.variantLabel}
                            </p>
                          )}
                          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            {item.quantity} x {item.product.price.toFixed(2)} €
                          </p>
                          {!item.product.available && (
                            <p className="text-xs" style={{ color: "var(--error-color)" }}>Not available</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={loading}
                          className="p-1 transition-colors"
                          style={{ color: "var(--cart-remove-btn)" }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "var(--cart-remove-btn-hover)"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--cart-remove-btn)"}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M18 6L6 18M6 6L18 18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
                    {cart.discountPercent > 0 && (
                      <div className="flex justify-between text-sm mb-2">
                        <span style={{ color: "var(--cart-summary-label)" }}>
                          Discount ({cart.discountPercent}%)
                        </span>
                        <span style={{ color: "var(--success-color)" }}>
                          -{cart.discount.toFixed(2)} €
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                      <span>Total</span>
                      <span>{cart.total.toFixed(2)} €</span>
                    </div>

                    <div className="space-y-2">
                      <Link
                        href="/carrito"
                        onClick={() => setIsOpen(false)}
                        className="btn-secondary block w-full text-center"
                      >
                        View Cart
                      </Link>
                      <Link
                        href="/checkout"
                        onClick={() => setIsOpen(false)}
                        className="btn-primary block w-full text-center"
                      >
                        Checkout
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
