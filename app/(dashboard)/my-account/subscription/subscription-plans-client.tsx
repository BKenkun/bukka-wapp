"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { SubscriptionPlanCard } from "@/components/subscription-plan-card"
import {
  ReferralCodeInput,
  type AppliedReferral,
} from "@/components/referral-code-input"
import { toast } from "sonner"

interface TransformedPlan {
  id: string
  name: string
  slug: string
  price: string
  description: string
  features: { text: string; included: boolean }[]
  buttonText: string
  isCurrentPlan: boolean
  monthlyPrice?: number
}

interface SubscriptionPlansClientProps {
  plans: TransformedPlan[]
}

function parsePrice(price: string): number {
  const match = price.match(/\d+(?:[.,]\d+)?/)
  if (!match) return 0
  return Number(match[0].replace(",", "."))
}

export function SubscriptionPlansClient({ plans }: SubscriptionPlansClientProps) {
  const router = useRouter()
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null)
  const [appliedReferral, setAppliedReferral] = useState<AppliedReferral | null>(null)

  const referralAmount = useMemo(() => {
    if (!plans.length) return 0
    const paid = plans.filter((p) => parsePrice(p.price) > 0)
    if (!paid.length) return 0
    return Math.min(...paid.map((p) => parsePrice(p.price)))
  }, [plans])

  const handleSubscribe = async (planId: string) => {
    setSubscribingPlanId(planId)

    try {
      const res = await fetch("/api/payments/easierpay/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          referralCode: appliedReferral?.code || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.payLink) {
          toast.info("Redirecting to payment gateway...")
          window.location.href = data.payLink
          return
        }
      }

      const error = await res.json().catch(() => null)
      toast.error(error?.error || "Error processing subscription")
    } catch (error) {
      console.error("Error subscribing:", error)
      toast.error("Error processing subscription")
    } finally {
      setSubscribingPlanId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="max-w-md mx-auto">
        <ReferralCodeInput
          context="subscription"
          amount={referralAmount}
          applied={appliedReferral}
          onApply={setAppliedReferral}
          onRemove={() => setAppliedReferral(null)}
          title="Have a creator code?"
        />
        {appliedReferral && appliedReferral.discountPercent > 0 && (
          <p
            className="text-xs text-center mt-2"
            style={{ color: "var(--text-muted)" }}
          >
            The discount will be applied to the first payment of your subscription.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <SubscriptionPlanCard
            key={plan.slug}
            name={plan.name}
            price={plan.price}
            description={plan.description}
            features={plan.features}
            buttonText={plan.buttonText}
            isCurrentPlan={plan.isCurrentPlan}
            planId={plan.id}
            onSubscribe={handleSubscribe}
            subscribing={subscribingPlanId === plan.id}
          />
        ))}
      </div>
    </div>
  )
}
