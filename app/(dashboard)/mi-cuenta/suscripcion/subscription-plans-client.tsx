"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SubscriptionPlanCard } from "@/components/subscription-plan-card"
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
}

interface SubscriptionPlansClientProps {
  plans: TransformedPlan[]
}

export function SubscriptionPlansClient({ plans }: SubscriptionPlansClientProps) {
  const router = useRouter()
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    setSubscribingPlanId(planId)

    try {
      const res = await fetch("/api/payments/easierpay/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.payLink) {
          toast.info("Redirigiendo a la pasarela de pago...")
          window.location.href = data.payLink
          return
        }
      }

      const error = await res.json().catch(() => null)
      toast.error(error?.error || "Error al procesar la suscripción")
    } catch (error) {
      console.error("Error subscribing:", error)
      toast.error("Error al procesar la suscripción")
    } finally {
      setSubscribingPlanId(null)
    }
  }

  return (
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
  )
}
