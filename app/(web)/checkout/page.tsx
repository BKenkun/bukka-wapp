"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { ShippingCalculator, FreeShippingProgress } from "@/components/checkout/shipping-calculator"
import { Checkbox } from "@/components/ui/checkbox"
import { ReferralCodeInput, type AppliedReferral } from "@/components/referral-code-input"

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

interface AppliedPromoCode {
  code: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: number
  discountAmount: number
}

interface ShippingRate {
  id: string
  name: string
  description: string | null
  originalPrice: number
  price: number
  isFree: boolean
  estimatedDays: number | null
  isAvailable: boolean
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
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [selectedShippingRate, setSelectedShippingRate] = useState<ShippingRate | null>(null)

  // Promo code state
  const [promoCodeInput, setPromoCodeInput] = useState("")
  const [appliedPromoCode, setAppliedPromoCode] = useState<AppliedPromoCode | null>(null)
  const [promoCodeLoading, setPromoCodeLoading] = useState(false)
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null)

  // Referral code state
  const [appliedReferral, setAppliedReferral] = useState<AppliedReferral | null>(null)

  // Order confirmation state
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string
    total: number
  } | null>(null)

  useEffect(() => {
    if (status === "loading") return

    const fetchCart = async () => {
      try {
        const res = await fetch("/api/cart")
        if (res.ok) {
          const data = await res.json()
          if (!data.cart || data.cart.items.length === 0) {
            router.push("/carrito")
            return
          }
          setCart(data.cart)
          // Pre-fill email when a registered user is logged in
          if (session?.user?.email) {
            setShippingAddress((prev) => ({
              ...prev,
              email: prev.email || session.user?.email || "",
            }))
          }
        }
      } catch (error) {
        console.error("Error fetching cart:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [status, session, router])

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
      toast.error("Please fill in all required fields")
      return
    }
    // Validate shipping rate selection
    if (!selectedShippingRate) {
      toast.error("Please select a shipping method")
      return
    }
    setStep("payment")
  }

  // Handle promo code application
  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return

    setPromoCodeLoading(true)
    setPromoCodeError(null)

    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCodeInput.trim(),
          subtotal: cart?.total ?? 0,
        }),
      })

      const data = await res.json()

      if (res.ok && data.valid) {
        setAppliedPromoCode({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: data.discountAmount,
        })
        toast.success(data.message)
      } else {
        setPromoCodeError(data.error || "Invalid code")
      }
    } catch (error) {
      setPromoCodeError("Error validating code")
    } finally {
      setPromoCodeLoading(false)
    }
  }

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null)
    setPromoCodeInput("")
    setPromoCodeError(null)
  }

  // Calculate totals with shipping, promo code y referido
  const shippingCost = selectedShippingRate?.price ?? 0
  const promoDiscount = appliedPromoCode?.discountAmount ?? 0
  const referralDiscount = appliedReferral?.discountAmount ?? 0
  const grandTotal = Math.max(
    0,
    (cart?.total ?? 0) - promoDiscount - referralDiscount + shippingCost,
  )

  const handlePlaceOrder = async () => {
    setSubmitting(true)

    try {
      // Step 1: Create the order
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress,
          paymentGateway: paymentMethod === "card" ? "easierpay" : paymentMethod,
          shippingRateId: selectedShippingRate?.id,
          shippingMethod: selectedShippingRate?.name,
          shippingCost: selectedShippingRate?.price ?? 0,
          promoCode: appliedPromoCode?.code || null,
          promoDiscount: promoDiscount,
          referralCode: appliedReferral?.code || null,
          notes: "",
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || "Error processing your order")
        return
      }

      const data = await res.json()

      // Step 2: For card payments, redirect to EasierPay
      if (paymentMethod === "card") {
        toast.info("Redirecting to payment gateway...")

        const payRes = await fetch("/api/payments/easierpay/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.order.id }),
        })

        if (payRes.ok) {
          const payData = await payRes.json()
          if (payData.payLink) {
            window.location.href = payData.payLink
            return
          }
        }

        // If EasierPay initiation fails, show error but order is created
        const payError = await payRes.json().catch(() => null)
        toast.error(payError?.error || "Error connecting to the payment gateway. You can retry from your order history.")
        // Redirect to result page with failed status
        router.push(`/checkout/resultado?order=${data.order.orderNumber}&status=failed`)
        return
      }

      // Fallback (shouldn't hit unless new payment method is added)
      setConfirmedOrder({
        orderNumber: data.order.orderNumber,
        total: data.order.total,
      })
      setStep("confirmation")
      toast.success("Order placed successfully!")
    } catch (error) {
      console.error("Error placing order:", error)
      toast.error("Error processing your order")
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 pt-8 pb-12">
          <div className="text-center py-12">Loading...</div>
        </div>
      </main>
    )
  }

  if (step === "confirmation") {
    return (
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-[800px] mx-auto px-4 md:px-8 pt-8 pb-12">
          <div className="text-center py-8">
            {/* Success Animation */}
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-8 animate-pulse" style={{ backgroundColor: "var(--success-color)" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
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

            <h1 className="text-4xl font-bold mb-4 font-montserrat" style={{ color: "var(--text-primary)" }}>
              Thank You for Your Purchase!
            </h1>

            {confirmedOrder && (
              <div className="p-6 mb-8 text-left max-w-md mx-auto" style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)" }}>
                <p className="text-sm mb-2" style={{ color: "var(--cart-summary-label)" }}>Order number:</p>
                <p className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>{confirmedOrder.orderNumber}</p>
                <p className="text-sm mb-2" style={{ color: "var(--cart-summary-label)" }}>Total:</p>
                <p className="text-2xl font-bold" style={{ color: "var(--brand-color)" }}>{confirmedOrder.total.toFixed(2)} €</p>
              </div>
            )}

            <p className="mb-4 max-w-md mx-auto" style={{ color: "var(--cart-summary-label)" }}>
              We have sent a confirmation email with your order details to your email address.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/my-account/payment-history"
                className="btn-primary inline-block"
              >
                View My Orders
              </Link>
              <Link
                href="/shop"
                className="btn-secondary inline-block"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col">
      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 pt-8 pb-12">
        {/* Header */}
        <h1 className="font-montserrat font-bold text-[30px] leading-[36px] mb-8" style={{ color: "var(--text-secondary)" }}>
          Checkout
        </h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-12">
          <div
            className="flex items-center gap-2"
            style={{ color: step === "shipping" ? "var(--brand-color)" : "var(--cart-summary-label)" }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={step === "shipping" ? { backgroundColor: "var(--brand-color)", color: "var(--text-primary)" } : { backgroundColor: "var(--border-color)", color: "var(--cart-summary-label)" }}
            >
              1
            </div>
            <span className="font-medium">Shipping</span>
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-color)" }} />
          <div
            className="flex items-center gap-2"
            style={{ color: step === "payment" ? "var(--brand-color)" : "var(--cart-summary-label)" }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={step === "payment" ? { backgroundColor: "var(--brand-color)", color: "var(--text-primary)" } : { backgroundColor: "var(--border-color)", color: "var(--cart-summary-label)" }}
            >
              2
            </div>
            <span className="font-medium">Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {step === "shipping" && (
              <form onSubmit={handleShippingSubmit} className="p-6" style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)" }}>
                <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Shipping Address</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: "var(--form-label-color)" }}>First Name *</label>
                    <input
                      type="text"
                      value={shippingAddress.firstName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                      }
                      className="w-full px-4 py-3 focus:outline-none"
                      style={{ backgroundColor: "var(--form-input-bg)", border: "1px solid var(--form-input-border)", color: "var(--form-input-text)" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: "var(--form-label-color)" }}>Last Name *</label>
                    <input
                      type="text"
                      value={shippingAddress.lastName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                      }
                      className="w-full px-4 py-3 focus:outline-none"
                      style={{ backgroundColor: "var(--form-input-bg)", border: "1px solid var(--form-input-border)", color: "var(--form-input-text)" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: "var(--form-label-color)" }}>Email *</label>
                    <input
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, email: e.target.value })
                      }
                      className="w-full px-4 py-3 focus:outline-none"
                      style={{ backgroundColor: "var(--form-input-bg)", border: "1px solid var(--form-input-border)", color: "var(--form-input-text)" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: "var(--form-label-color)" }}>Phone</label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 focus:outline-none"
                      style={{ backgroundColor: "var(--form-input-bg)", border: "1px solid var(--form-input-border)", color: "var(--form-input-text)" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm mb-2" style={{ color: "var(--form-label-color)" }}>Address *</label>
                  <input
                    type="text"
                    value={shippingAddress.address}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address: e.target.value })
                    }
                    className="w-full px-4 py-3 focus:outline-none"
                    style={{ backgroundColor: "var(--form-input-bg)", border: "1px solid var(--form-input-border)", color: "var(--form-input-text)" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
                    placeholder="Street, number, apartment..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: "var(--form-label-color)" }}>City *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      className="w-full px-4 py-3 focus:outline-none"
                      style={{ backgroundColor: "var(--form-input-bg)", border: "1px solid var(--form-input-border)", color: "var(--form-input-text)" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: "var(--form-label-color)" }}>Postal Code *</label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                      }
                      placeholder="Postal Code"
                      className="w-full px-4 py-3 focus:outline-none"
                      style={{ backgroundColor: "var(--form-input-bg)", border: "1px solid var(--form-input-border)", color: "var(--form-input-text)" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: "var(--form-label-color)" }}>Country</label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, country: e.target.value })
                      }
                      className="w-full px-4 py-3 focus:outline-none"
                      style={{ backgroundColor: "var(--form-input-bg)", border: "1px solid var(--form-input-border)", color: "var(--form-input-text)" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
                    >
                      <option value="ES">Spain</option>
                      <option value="PT">Portugal</option>
                      <option value="FR">France</option>
                      <option value="DE">Germany</option>
                      <option value="IT">Italy</option>
                      <option value="UK">United Kingdom</option>
                    </select>
                  </div>
                </div>

                {/* Shipping Calculator */}
                <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border-color)" }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Shipping Options</h3>
                  <ShippingCalculator
                    postalCode={shippingAddress.postalCode}
                    country={shippingAddress.country}
                    subtotal={cart?.total ?? 0}
                    onPostalCodeChange={(pc) =>
                      setShippingAddress({ ...shippingAddress, postalCode: pc })
                    }
                    onShippingRateSelect={setSelectedShippingRate}
                    selectedRateId={selectedShippingRate?.id}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedShippingRate}
                  className="btn-primary mt-6 w-full"
                >
                  Continue to Payment
                </button>
              </form>
            )}

            {step === "payment" && (
              <div className="p-6" style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)" }}>
                <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Payment Method</h2>

                {/* Shipping Address Summary */}
                <div className="p-4 mb-6" style={{ backgroundColor: "var(--global-bg)", border: "1px solid var(--border-color)" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm mb-1" style={{ color: "var(--form-label-color)" }}>Ship to:</p>
                      <p style={{ color: "var(--text-primary)" }}>
                        {shippingAddress.firstName} {shippingAddress.lastName}
                      </p>
                      <p className="text-sm" style={{ color: "var(--form-label-color)" }}>{shippingAddress.address}</p>
                      <p className="text-sm" style={{ color: "var(--form-label-color)" }}>
                        {shippingAddress.postalCode} {shippingAddress.city}
                      </p>
                      {selectedShippingRate && (
                        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                          <p className="text-sm mb-1" style={{ color: "var(--form-label-color)" }}>Shipping method:</p>
                          <p style={{ color: "var(--text-primary)" }}>{selectedShippingRate.name}</p>
                          <p className="font-medium" style={{ color: "var(--brand-color)" }}>
                            {selectedShippingRate.isFree ? "FREE" : `${selectedShippingRate.price.toFixed(2)} €`}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-sm hover:underline"
                      style={{ color: "var(--accent-color)" }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                  <label
                    className="block border p-4 cursor-pointer"
                    style={paymentMethod === "card" ? { borderColor: "var(--brand-color)", backgroundColor: "color-mix(in srgb, var(--brand-color) 10%, transparent)" } : { borderColor: "var(--border-color)" }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ accentColor: "var(--brand-color)" }}
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
                          style={{ color: "var(--text-primary)" }}
                        >
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>Credit/Debit Card</span>
                      </div>
                    </div>
                  </label>

                </div>

                <div className="flex items-start gap-3 mt-4">
                  <Checkbox
                    id="terms-accepted"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    required
                    aria-describedby="terms-accepted-description"
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="terms-accepted"
                    id="terms-accepted-description"
                    className="text-sm cursor-pointer leading-relaxed"
                    style={{ color: "var(--form-label-color)" }}
                  >
                    I have read and accept the{" "}
                    <Link
                      href="/p/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: "var(--accent-color)" }}
                    >
                      Terms of Service
                    </Link>
                    ,{" "}
                    <Link
                      href="/p/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: "var(--accent-color)" }}
                    >
                      Privacy Policy
                    </Link>
                    ,{" "}
                    <Link
                      href="/p/legal-notice"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: "var(--accent-color)" }}
                    >
                      Legal Notice
                    </Link>
                    , and{" "}
                    <Link
                      href="/p/cookie-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: "var(--accent-color)" }}
                    >
                      Cookie Policy
                    </Link>
                    . I understand that placing this order creates a binding
                    obligation to pay.
                  </label>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep("shipping")}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting || !termsAccepted}
                    className="btn-primary flex-1"
                  >
                    {submitting ? "Processing..." : "Place Order & Pay"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="p-6 sticky top-4" style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)" }}>
              <h2 className="font-montserrat font-bold text-xl mb-6" style={{ color: "var(--text-primary)" }}>Your Order</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                {cart?.items.map((item) => (
                  <div key={item.id} className={`flex gap-3 ${!item.product.available ? "opacity-50" : ""}`}>
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.product.imageUrl || "/placeholder.jpg"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute -top-2 -right-2 text-xs w-5 h-5 flex items-center justify-center" style={{ backgroundColor: "var(--brand-color)", color: "var(--text-primary)" }}>
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate" style={{ color: "var(--cart-item-name)" }}>{item.product.name}</h4>
                      {item.variantLabel && (
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{item.variantLabel}</p>
                      )}
                      <p className="text-sm" style={{ color: "var(--cart-item-meta)" }}>{item.product.price.toFixed(2)} €</p>
                      {!item.product.available && (
                        <p className="text-xs" style={{ color: "var(--error-color)" }}>Not available</p>
                      )}
                    </div>
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {(item.product.price * item.quantity).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                <div className="flex justify-between" style={{ color: "var(--cart-summary-label)" }}>
                  <span>Subtotal</span>
                  <span style={{ color: "var(--text-primary)" }}>{cart?.subtotal.toFixed(2)} €</span>
                </div>

                {cart && cart.discountPercent > 0 && (
                  <div className="flex justify-between" style={{ color: "var(--success-color)" }}>
                    <span>Member discount ({cart.discountPercent}%)</span>
                    <span>-{cart.discount.toFixed(2)} €</span>
                  </div>
                )}

                {appliedPromoCode && (
                  <div className="flex justify-between" style={{ color: "var(--success-color)" }}>
                    <span>Code {appliedPromoCode.code}</span>
                    <span>-{appliedPromoCode.discountAmount.toFixed(2)} €</span>
                  </div>
                )}

                {appliedReferral && appliedReferral.discountPercent > 0 && (
                  <div className="flex justify-between" style={{ color: "var(--success-color)" }}>
                    <span>
                      {appliedReferral.owner.type === "performer"
                        ? `Creator coupon ${appliedReferral.owner.name}`
                        : `Coupon ${appliedReferral.owner.name}`}{" "}
                      ({appliedReferral.discountPercent}%)
                    </span>
                    <span>-{appliedReferral.discountAmount.toFixed(2)} €</span>
                  </div>
                )}

                <div className="flex justify-between" style={{ color: "var(--cart-summary-label)" }}>
                  <span>Shipping</span>
                  {selectedShippingRate ? (
                    <span style={{ color: selectedShippingRate.isFree ? "var(--success-color)" : "var(--text-primary)" }}>
                      {selectedShippingRate.isFree ? "FREE" : `${shippingCost.toFixed(2)} €`}
                    </span>
                  ) : (
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Enter postal code</span>
                  )}
                </div>

                <div className="pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                  <div className="flex justify-between font-bold text-xl" style={{ color: "var(--text-primary)" }}>
                    <span>Total</span>
                    <span>{grandTotal.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Promo Code Section */}
              <div className="pt-4 mt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
                <p className="font-medium mb-3" style={{ color: "var(--text-primary)" }}>Promo Code</p>
                {appliedPromoCode ? (
                  <div className="flex items-center justify-between p-3" style={{ backgroundColor: "color-mix(in srgb, var(--success-color) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--success-color) 30%, transparent)" }}>
                    <div>
                      <p className="font-medium" style={{ color: "var(--success-color)" }}>{appliedPromoCode.code}</p>
                      <p className="text-sm" style={{ color: "var(--success-color)" }}>
                        -{appliedPromoCode.discountAmount.toFixed(2)} €
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromoCode}
                      className="text-sm transition-colors"
                      style={{ color: "var(--cart-summary-label)" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--cart-summary-label)"}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value.toUpperCase())
                        setPromoCodeError(null)
                      }}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 text-sm focus:outline-none"
                      style={{ backgroundColor: "var(--form-input-bg)", border: "1px solid var(--form-input-border)", color: "var(--form-input-text)" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "var(--form-input-focus-border)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "var(--form-input-border)"}
                    />
                    <button
                      onClick={handleApplyPromoCode}
                      disabled={promoCodeLoading || !promoCodeInput.trim()}
                      className="px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}
                    >
                      {promoCodeLoading ? "..." : "Apply"}
                    </button>
                  </div>
                )}
                {promoCodeError && (
                  <p className="text-xs mt-2" style={{ color: "var(--error-color)" }}>{promoCodeError}</p>
                )}
              </div>

              {/* Referral Code Section */}
              <div className="pt-4 mt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
                <ReferralCodeInput
                  context="shop"
                  amount={Math.max(0, (cart?.total ?? 0) - promoDiscount)}
                  applied={appliedReferral}
                  onApply={setAppliedReferral}
                  onRemove={() => setAppliedReferral(null)}
                  title="Have a creator code?"
                />
              </div>

              <Link
                href="/carrito"
                className="block text-center text-sm mt-4 hover:underline"
                style={{ color: "var(--accent-color)" }}
              >
                Edit Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
