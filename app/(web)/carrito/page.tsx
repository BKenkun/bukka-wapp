"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

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
    stock: number
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

export default function CarritoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/carrito")
    }
  }, [status, router])

  useEffect(() => {
    const fetchCart = async () => {
      if (!session?.user) return

      try {
        const res = await fetch("/api/cart")
        if (res.ok) {
          const data = await res.json()
          setCart(data.cart)
        }
      } catch (error) {
        console.error("Error fetching cart:", error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchCart()
    }
  }, [session])

  const refetchCart = async () => {
    try {
      const res = await fetch("/api/cart")
      if (res.ok) {
        const data = await res.json()
        setCart(data.cart)
        window.dispatchEvent(new CustomEvent("cart-updated"))
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setUpdating(itemId)

    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      })

      if (res.ok) {
        await refetchCart()
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setUpdating(itemId)

    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await refetchCart()
      }
    } catch (error) {
      console.error("Error removing item:", error)
    } finally {
      setUpdating(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="flex-1 flex flex-col bg-black text-white">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 pt-8 pb-12">
          <div className="text-center py-12">Cargando...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col bg-black text-white">

      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 pt-8 pb-12">
        {/* Header */}
        <h1 className="font-montserrat font-bold text-[30px] leading-[36px] text-[#E5E7EB] mb-2">
          Tu Carrito
        </h1>
        <p className="text-white font-montserrat text-base mb-8">
          {cart?.itemCount || 0} {cart?.itemCount === 1 ? "producto" : "productos"} en tu carrito
        </p>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-6 text-gray-600"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p className="text-gray-400 text-lg mb-6">Tu carrito esta vacio</p>
            <Link
              href="/tienda"
              className="inline-block bg-[#FA4860] text-white font-montserrat font-semibold px-8 py-3 hover:bg-[#e8415a] transition-colors"
            >
              Explorar Tienda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-[#1a1a1a] border border-gray-800 p-4 flex gap-4 ${!item.product.available ? "opacity-60" : ""}`}
                >
                  {/* Product Image */}
                  <Link href={`/tienda/${item.product.slug}`} className="flex-shrink-0">
                    <div className="relative w-24 h-24 md:w-32 md:h-32">
                      <Image
                        src={item.product.imageUrl || "/placeholder.jpg"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/tienda/${item.product.slug}`}>
                      <h3 className="text-white font-montserrat font-medium text-lg hover:text-[#FA4860] transition-colors truncate">
                        {item.product.name}
                      </h3>
                    </Link>

                    {/* Variant Label */}
                    {item.variantLabel && (
                      <p className="text-gray-400 text-sm mt-1">
                        {item.variantLabel}
                      </p>
                    )}

                    <p className="text-[#FA4860] font-montserrat font-bold text-xl mt-2">
                      {item.product.price.toFixed(2)} €
                    </p>

                    {/* Availability warnings */}
                    {!item.product.available ? (
                      <p className="text-red-500 text-sm mt-1">
                        Este producto ya no esta disponible
                      </p>
                    ) : item.product.stock > 0 && item.product.stock <= 3 && (
                      <p className="text-yellow-500 text-sm mt-1">
                        Solo quedan {item.product.stock} unidades
                      </p>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 mt-4">
                      {item.product.available ? (
                        <div className="flex items-center border border-gray-700">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={updating === item.id || item.quantity <= 1}
                            className="px-3 py-1 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 text-white font-medium">
                            {updating === item.id ? "..." : item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={
                              updating === item.id ||
                              (item.product.stock > 0 && item.quantity >= item.product.stock)
                            }
                            className="px-3 py-1 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="text-red-500 text-sm">No disponible</span>
                      )}

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={updating === item.id}
                        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-white font-montserrat font-bold text-lg">
                      {(item.product.price * item.quantity).toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a1a] border border-gray-800 p-6 sticky top-4">
                <h2 className="text-white font-montserrat font-bold text-xl mb-6">
                  Resumen del Pedido
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white">{cart.subtotal.toFixed(2)} €</span>
                  </div>

                  {cart.discountPercent > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Descuento miembro ({cart.discountPercent}%)</span>
                      <span>-{cart.discount.toFixed(2)} €</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-400">
                    <span>Envio</span>
                    <span className="text-white">Calculado en checkout</span>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between text-white font-bold text-xl">
                      <span>Total</span>
                      <span>{cart.total.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full text-center bg-[#FA4860] text-white font-montserrat font-semibold py-3 hover:bg-[#e8415a] transition-colors"
                >
                  Finalizar Compra
                </Link>

                <Link
                  href="/tienda"
                  className="block w-full text-center text-[#00B1DE] font-montserrat py-3 mt-4 hover:underline"
                >
                  Continuar Comprando
                </Link>

                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Pago seguro SSL</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Garantia de satisfaccion</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span>Envio discreto</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
