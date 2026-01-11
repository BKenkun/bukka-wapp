"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Product {
  id: string
  slug: string
  imageUrl: string
  title: string
  price: number
  tag?: string
}

interface ProductSidebarProps {
  products: Product[]
}

export function ProductSidebar({ products }: ProductSidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    setLoadingId(productId)

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      })

      if (res.ok) {
        toast.success("Producto añadido al carrito")
        window.dispatchEvent(new CustomEvent("cart-updated"))
      } else {
        const error = await res.json()
        toast.error(error.error || "Error al añadir al carrito")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Error al añadir al carrito")
    } finally {
      setLoadingId(null)
    }
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-[5px]">
      {products.map((product) => (
        <Link key={product.id} href={`/tienda/${product.slug}`}>
          <div className="relative cursor-pointer group overflow-hidden h-[225px]">
            <img
              src={product.imageUrl || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-[225px] object-cover transition-transform duration-300"
            />
            {product.tag && (
              <span
                className="absolute top-3 left-3 bg-[#00B1DE] text-white px-3 py-1 z-10"
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {product.tag}
              </span>
            )}

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <h3
                className="text-white mb-2"
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "17.201px",
                  fontWeight: 500,
                  lineHeight: "25.801px",
                }}
              >
                {product.title}
              </h3>
              <p
                className="text-white mb-4"
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "17.201px",
                  fontWeight: 400,
                  lineHeight: "25.801px",
                }}
              >
                {product.price.toFixed(2)} €
              </p>
              <button
                className="text-white text-center cursor-pointer w-full disabled:opacity-50"
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "16px",
                  fontWeight: 600,
                  background: "#FA4860",
                  padding: "10px 20px",
                  border: "0 solid #E5E7EB",
                }}
                disabled={loadingId === product.id}
                onClick={(e) => handleAddToCart(e, product.id)}
              >
                {loadingId === product.id ? "Añadiendo..." : "Añadir al carrito"}
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
