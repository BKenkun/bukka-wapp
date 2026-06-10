import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { SectionHeader } from "@/components/section-header"
import { PublicPlansClient } from "./public-plans-client"

export const metadata = {
  title: "Subscriptions",
}

export default async function PublicSubscriptionsPage() {
  const session = await auth()

  // Usuarios logueados gestionan su plan desde su cuenta
  if (session?.user?.id) {
    redirect("/my-account/subscription")
  }

  const subscriptionPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { level: "asc" },
  })

  const transformedPlans = subscriptionPlans.map((plan) => {
    const features = Array.isArray(plan.features)
      ? (plan.features as { text: string; included: boolean }[])
      : []
    const monthlyPrice = Number(plan.monthlyPrice)

    const priceDisplay = plan.isFree ? "Free" : `${monthlyPrice.toFixed(2)} €`

    // Planes gratuitos no tienen botón de compra; el resto invita a registrarse
    const buttonText = plan.isFree ? "" : `Join ${plan.name}`

    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price: priceDisplay,
      description: plan.description || "",
      features: features.map((f) => ({
        text: typeof f === "string" ? f : f.text,
        included: typeof f === "string" ? true : f.included,
      })),
      buttonText,
      isCurrentPlan: false,
    }
  })

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}
    >
      <main className="pt-8 flex flex-col flex-1 pb-12 px-4 md:px-8">
        <SectionHeader title="SUBSCRIPTIONS" />
        <p
          className="mt-4 text-center text-sm"
          style={{ color: "var(--text-muted)", fontFamily: "var(--global-font)" }}
        >
          Choose your plan. You will create your account during checkout.
        </p>
        <div className="mt-10 max-w-[1400px] w-full mx-auto">
          <PublicPlansClient plans={transformedPlans} />
        </div>
      </main>
    </div>
  )
}
