"use client"

import { useMemo, useState } from "react"
import { SubscriptionPlanCard } from "@/components/subscription-plan-card"
import {
  ReferralCodeInput,
  type AppliedReferral,
} from "@/components/referral-code-input"
import { useAuthModal } from "@/components/auth/auth-modal-provider"

interface TransformedPlan {
  id: string
  name: string
  slug: string
  price: string
  description: string
  features: { text: string; included: boolean }[]
  buttonText: string
  isCurrentPlan: boolean
}

interface PublicPlansClientProps {
  plans: TransformedPlan[]
}

function parsePrice(price: string): number {
  const match = price.match(/\d+(?:[.,]\d+)?/)
  if (!match) return 0
  return Number(match[0].replace(",", "."))
}

export function PublicPlansClient({ plans }: PublicPlansClientProps) {
  const { openAuthModal } = useAuthModal()
  const [appliedReferral, setAppliedReferral] = useState<AppliedReferral | null>(null)

  const referralAmount = useMemo(() => {
    if (!plans.length) return 0
    const paid = plans.filter((p) => parsePrice(p.price) > 0)
    if (!paid.length) return 0
    return Math.min(...paid.map((p) => parsePrice(p.price)))
  }, [plans])

  // Visitante sin cuenta: cualquier plan pasa primero por el registro.
  // El cupón queda guardado en la cookie ref_code y se aplica al suscribirse.
  const handleSubscribe = (_planId: string) => {
    openAuthModal({ view: "register", callbackUrl: "/my-account/subscription" })
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
            subscribing={false}
          />
        ))}
      </div>
    </div>
  )
}
