"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    slug: string
    name: string
    price: number
    imageUrl: string | null
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

interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<"shipping" | "payment" | "confirmation">("shipping")

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "ES",
  })

  const [paymentMethod, setPaymentMethod] = useState<string>("card")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout")
    }
  }, [status, router])

  useEffect(() => {
    const fetchCart = async () => {
      if (!session?.user) return

      try {
        const res = await fetch("/api/cart")
        if (res.ok) {
          const data = await res.json()
          if (!data.cart || data.cart.items.length === 0) {
            router.push("/carrito")
            return
          }
          setCart(data.cart)
          // Pre-fill email if available
          if (session.user.email) {
            setShippingAddress((prev) => ({
              ...prev,
              email: session.user.email || "",
            }))
          }
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
  }, [session, router])

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate required fields
    if (
      !shippingAddress.firstName ||
      !shippingAddress.lastName ||
      !shippingAddress.email ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode
    ) {
      toast.error("Por favor completa todos los campos obligatorios")
      return
    }
    setStep("payment")
  }

  const handlePlaceOrder = async () => {
    setSubmitting(true)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress,
          paymentGateway: paymentMethod,
          notes: "",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setStep("confirmation")
        toast.success("Pedido realizado con exito")
        // Redirect to order confirmation after a delay
        setTimeout(() => {
          router.push(`/mi-cuenta/historial-de-pagos`)
        }, 3000)
      } else {
        const error = await res.json()
        toast.error(error.error || "Error al procesar el pedido")
      }
    } catch (error) {
      console.error("Error placing order:", error)
      toast.error("Error al procesar el pedido")
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="flex-1 flex flex-col bg-black text-white">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-12">
          <div className="text-center py-12">Cargando...</div>
        </div>
      </main>
    )
  }

  if (step === "confirmation") {
    return (
      <main className="flex-1 flex flex-col bg-black text-white">
        <div className="w-full max-w-[800px] mx-auto px-4 md:px-8 py-12">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Pedido Confirmado</h1>
            <p className="text-gray-400 mb-8">
              Gracias por tu compra. Te hemos enviado un email con los detalles de tu pedido.
            </p>
            <Link
              href="/mi-cuenta/historial-de-pagos"
              className="inline-block bg-[#FA4860] text-white font-semibold px-8 py-3 hover:bg-[#e8415a] transition-colors"
            >
              Ver Mis Pedidos
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col bg-black text-white">
      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <h1 className="font-montserrat font-bold text-[30px] leading-[36px] text-[#E5E7EB] mb-8">
          Checkout
        </h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-12">
          <div
            className={`flex items-center gap-2 ${
              step === "shipping" ? "text-[#FA4860]" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === "shipping" ? "bg-[#FA4860] text-white" : "bg-gray-700 text-gray-400"
              }`}
            >
              1
            </div>
            <span className="font-medium">Envio</span>
          </div>
          <div className="flex-1 h-px bg-gray-700" />
          <div
            className={`flex items-center gap-2 ${
              step === "payment" ? "text-[#FA4860]" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === "payment" ? "bg-[#FA4860] text-white" : "bg-gray-700 text-gray-400"
              }`}
            >
              2
            </div>
            <span className="font-medium">Pago</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {step === "shipping" && (
              <form onSubmit={handleShippingSubmit} className="bg-[#1a1a1a] border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Direccion de Envio</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Nombre *</label>
                    <input
                      type="text"
                      value={shippingAddress.firstName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                      }
                      className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:border-[#FA4860] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Apellidos *</label>
                    <input
                      type="text"
                      value={shippingAddress.lastName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                      }
                      className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:border-[#FA4860] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Email *</label>
                    <input
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, email: e.target.value })
                      }
                      className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:border-[#FA4860] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Telefono</label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, phone: e.target.value })
                      }
                      className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:border-[#FA4860] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-gray-400 text-sm mb-2">Direccion *</label>
                  <input
                    type="text"
                    value={shippingAddress.address}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address: e.target.value })
                    }
                    className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:border-[#FA4860] focus:outline-none"
                    placeholder="Calle, numero, piso..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Ciudad *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:border-[#FA4860] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Codigo Postal *</label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                      }
                      className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:border-[#FA4860] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Pais</label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, country: e.target.value })
                      }
                      className="w-full bg-black border border-gray-700 text-white px-4 py-3 focus:border-[#FA4860] focus:outline-none"
                    >
                      <option value="ES">Espana</option>
                      <option value="PT">Portugal</option>
                      <option value="FR">Francia</option>
                      <option value="DE">Alemania</option>
                      <option value="IT">Italia</option>
                      <option value="UK">Reino Unido</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full bg-[#FA4860] text-white font-semibold py-3 hover:bg-[#e8415a] transition-colors"
                >
                  Continuar al Pago
                </button>
              </form>
            )}

            {step === "payment" && (
              <div className="bg-[#1a1a1a] border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Metodo de Pago</h2>

                {/* Shipping Address Summary */}
                <div className="bg-black border border-gray-700 p-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Enviar a:</p>
                      <p className="text-white">
                        {shippingAddress.firstName} {shippingAddress.lastName}
                      </p>
                      <p className="text-gray-400 text-sm">{shippingAddress.address}</p>
                      <p className="text-gray-400 text-sm">
                        {shippingAddress.postalCode} {shippingAddress.city}
                      </p>
                    </div>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-[#00B1DE] text-sm hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                  <label
                    className={`block border p-4 cursor-pointer ${
                      paymentMethod === "card"
                        ? "border-[#FA4860] bg-[#FA4860]/10"
                        : "border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-[#FA4860]"
                      />
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-white"
                        >
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        <span className="text-white font-medium">Tarjeta de Credito/Debito</span>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`block border p-4 cursor-pointer ${
                      paymentMethod === "paypal"
                        ? "border-[#FA4860] bg-[#FA4860]/10"
                        : "border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="paypal"
                        checked={paymentMethod === "paypal"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-[#FA4860]"
                      />
                      <span className="text-white font-medium">PayPal</span>
                    </div>
                  </label>

                  <label
                    className={`block border p-4 cursor-pointer ${
                      paymentMethod === "transfer"
                        ? "border-[#FA4860] bg-[#FA4860]/10"
                        : "border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="transfer"
                        checked={paymentMethod === "transfer"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-[#FA4860]"
                      />
                      <span className="text-white font-medium">Transferencia Bancaria</span>
                    </div>
                  </label>
                </div>

                <p className="text-gray-400 text-sm mt-4">
                  Al hacer clic en &quot;Confirmar Pedido&quot;, aceptas nuestros{" "}
                  <Link href="/terminos" className="text-[#00B1DE] hover:underline">
                    Terminos y Condiciones
                  </Link>{" "}
                  y{" "}
                  <Link href="/privacidad" className="text-[#00B1DE] hover:underline">
                    Politica de Privacidad
                  </Link>
                  .
                </p>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep("shipping")}
                    className="flex-1 border border-gray-700 text-white font-semibold py-3 hover:bg-gray-800 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="flex-1 bg-[#FA4860] text-white font-semibold py-3 hover:bg-[#e8415a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Procesando..." : "Confirmar Pedido"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border border-gray-800 p-6 sticky top-4">
              <h2 className="text-white font-montserrat font-bold text-xl mb-6">Tu Pedido</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.product.imageUrl || "/placeholder.jpg"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute -top-2 -right-2 bg-[#FA4860] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-medium truncate">{item.product.name}</h4>
                      <p className="text-gray-400 text-sm">{item.product.price.toFixed(2)} €</p>
                    </div>
                    <div className="text-white font-medium">
                      {(item.product.price * item.quantity).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4 space-y-3">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">{cart?.subtotal.toFixed(2)} €</span>
                </div>

                {cart && cart.discountPercent > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Descuento miembro ({cart.discountPercent}%)</span>
                    <span>-{cart.discount.toFixed(2)} €</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-400">
                  <span>Envio</span>
                  <span className="text-white">Gratis</span>
                </div>

                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between text-white font-bold text-xl">
                    <span>Total</span>
                    <span>{cart?.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <Link
                href="/carrito"
                className="block text-center text-[#00B1DE] text-sm mt-4 hover:underline"
              >
                Editar Carrito
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
