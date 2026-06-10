"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

interface OrderData {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
}

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex flex-col">
          <div className="w-full max-w-[800px] mx-auto px-4 md:px-8 pt-8 pb-12">
            <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
              Loading...
            </div>
          </div>
        </main>
      }
    >
      <CheckoutResultContent />
    </Suspense>
  )
}

function CheckoutResultContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")
  const status = searchParams.get("status")

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/orders?orderNumber=${orderNumber}`)
        if (res.ok) {
          const data = await res.json()
          const found = data.orders?.[0]
          if (found) {
            setOrder(found)
          }
        }
      } catch (error) {
        console.error("Error fetching order:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber])

  const handleRetryPayment = async () => {
    if (!order) return
    setRetrying(true)

    try {
      const res = await fetch("/api/payments/easierpay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.payLink) {
          window.location.href = data.payLink
          return
        }
      }

      const error = await res.json().catch(() => null)
      alert(error?.error || "Error retrying payment")
    } catch (error) {
      console.error("Error retrying payment:", error)
      alert("Error retrying payment")
    } finally {
      setRetrying(false)
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-[800px] mx-auto px-4 md:px-8 pt-8 pb-12">
          <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
            Loading...
          </div>
        </div>
      </main>
    )
  }

  // Success state
  if (status === "success") {
    return (
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-[800px] mx-auto px-4 md:px-8 pt-8 pb-12">
          <div className="text-center py-8">
            <div
              className="w-24 h-24 flex items-center justify-center mx-auto mb-8 animate-pulse"
              style={{ backgroundColor: "var(--success-color)" }}
            >
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

            <h1
              className="text-4xl font-bold mb-4 font-montserrat"
              style={{ color: "var(--text-primary)" }}
            >
              Thank You for Your Purchase!
            </h1>

            {order && (
              <div
                className="p-6 mb-8 text-left max-w-md mx-auto"
                style={{
                  backgroundColor: "var(--surface-bg)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <p className="text-sm mb-2" style={{ color: "var(--cart-summary-label)" }}>
                  Order number:
                </p>
                <p className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                  {order.orderNumber}
                </p>
                <p className="text-sm mb-2" style={{ color: "var(--cart-summary-label)" }}>
                  Total:
                </p>
                <p className="text-2xl font-bold" style={{ color: "var(--brand-color)" }}>
                  {order.total.toFixed(2)} €
                </p>
                <p className="text-sm mt-4" style={{ color: "var(--cart-summary-label)" }}>
                  Payment status:
                </p>
                <p
                  className="text-sm font-medium"
                  style={{
                    color:
                      order.paymentStatus === "PAID"
                        ? "var(--success-color)"
                        : "var(--warning-color)",
                  }}
                >
                  {order.paymentStatus === "PAID" ? "Paid" : "Processing..."}
                </p>
              </div>
            )}

            <p className="mb-4 max-w-md mx-auto" style={{ color: "var(--cart-summary-label)" }}>
              We have sent a confirmation email with your order details.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/my-account/payment-history" className="btn-primary inline-block">
                View My Orders
              </Link>
              <Link href="/shop" className="btn-secondary inline-block">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Failed state
  if (status === "failed") {
    return (
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-[800px] mx-auto px-4 md:px-8 pt-8 pb-12">
          <div className="text-center py-8">
            <div
              className="w-24 h-24 flex items-center justify-center mx-auto mb-8"
              style={{ backgroundColor: "var(--error-color)" }}
            >
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>

            <h1
              className="text-4xl font-bold mb-4 font-montserrat"
              style={{ color: "var(--text-primary)" }}
            >
              Payment not completed
            </h1>

            <p className="mb-8 max-w-md mx-auto" style={{ color: "var(--cart-summary-label)" }}>
              We could not process your payment. Your order has been saved and you can
              try the payment again.
            </p>

            {order && (
              <div
                className="p-6 mb-8 text-left max-w-md mx-auto"
                style={{
                  backgroundColor: "var(--surface-bg)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <p className="text-sm mb-2" style={{ color: "var(--cart-summary-label)" }}>
                  Order:
                </p>
                <p className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  {order.orderNumber}
                </p>
                <p className="text-sm mb-2" style={{ color: "var(--cart-summary-label)" }}>
                  Amount due:
                </p>
                <p className="text-xl font-bold" style={{ color: "var(--brand-color)" }}>
                  {order.total.toFixed(2)} €
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {order && (
                <button
                  onClick={handleRetryPayment}
                  disabled={retrying}
                  className="btn-primary"
                >
                  {retrying ? "Processing..." : "Retry Payment"}
                </button>
              )}
              <Link href="/shop" className="btn-secondary inline-block">
                Back to Shop
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Default / unknown state
  return (
    <main className="flex-1 flex flex-col">
      <div className="w-full max-w-[800px] mx-auto px-4 md:px-8 pt-8 pb-12">
        <div className="text-center py-12">
          <p style={{ color: "var(--text-secondary)" }}>
            No order information found.
          </p>
          <Link href="/shop" className="btn-primary inline-block mt-4">
            Go to Shop
          </Link>
        </div>
      </div>
    </main>
  )
}
