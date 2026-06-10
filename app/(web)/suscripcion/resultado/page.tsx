"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function SubscriptionResultPage() {
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
      <SubscriptionResultContent />
    </Suspense>
  )
}

function SubscriptionResultContent() {
  const searchParams = useSearchParams()
  const planSlug = searchParams.get("plan")
  const status = searchParams.get("status")

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
              Subscription activated!
            </h1>

            <p className="mb-8 max-w-md mx-auto" style={{ color: "var(--cart-summary-label)" }}>
              Your subscription has been processed successfully. You can now enjoy all the
              exclusive content.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/videos" className="btn-primary inline-block">
                Explore Videos
              </Link>
              <Link href="/my-account/subscription" className="btn-secondary inline-block">
                View My Subscription
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

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
              We could not process your subscription payment. You can try again
              from your subscription page.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/my-account/subscription" className="btn-primary inline-block">
                Retry Subscription
              </Link>
              <Link href="/" className="btn-secondary inline-block">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col">
      <div className="w-full max-w-[800px] mx-auto px-4 md:px-8 pt-8 pb-12">
        <div className="text-center py-12">
          <p style={{ color: "var(--text-secondary)" }}>
            No subscription information found.
          </p>
          <Link href="/my-account/subscription" className="btn-primary inline-block mt-4">
            View Subscriptions
          </Link>
        </div>
      </div>
    </main>
  )
}
