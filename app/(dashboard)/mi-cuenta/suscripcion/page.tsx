import { AccountNav } from "@/components/account-nav"
import { SectionHeader } from "@/components/section-header"
import { SubscriptionPlanCard } from "@/components/subscription-plan-card"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

function formatDate(date: Date | null): string {
  if (!date) return "N/A"
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  })
}

export default async function SuscripcionPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [user, subscriptionPlans, billingHistory] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        SubscriptionPlan: true,
      },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
    }),
    prisma.subscriptionHistory.findMany({
      where: { userId: session.user.id },
      include: {
        SubscriptionPlan: {
          select: { id: true, slug: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  if (!user) {
    redirect("/login")
  }

  const isActive = user.subscriptionEnd && new Date(user.subscriptionEnd) > new Date()
  const currentPlan = user.SubscriptionPlan
  const currentPlanName = currentPlan?.name || "Visitante"
  const isFreeOrNoPlan = !currentPlan || currentPlan.isFree

  // Get current plan price
  const currentPlanPrice = currentPlan ? Number(currentPlan.monthlyPrice) : 0

  // Transform plans for the card component
  const transformedPlans = subscriptionPlans.map((plan) => {
    const features = Array.isArray(plan.features) ? (plan.features as { text: string; included: boolean }[]) : []
    const monthlyPrice = Number(plan.monthlyPrice)

    // Format price
    let priceDisplay: string
    if (plan.isFree) {
      priceDisplay = "Free"
    } else {
      priceDisplay = `${monthlyPrice.toFixed(2)} €`
    }

    // Determine button text
    let buttonText: string
    if (plan.id === currentPlan?.id) {
      buttonText = "Plan Actual"
    } else if (plan.isFree && plan.slug === "free") {
      buttonText = ""
    } else {
      buttonText = `Hazte ${plan.name}`
    }

    return {
      name: plan.name,
      slug: plan.slug,
      price: priceDisplay,
      description: plan.description || "",
      features: features.map((f) => ({
        text: typeof f === "string" ? f : f.text,
        included: typeof f === "string" ? true : f.included,
      })),
      buttonText,
      isCurrentPlan: plan.id === currentPlan?.id,
    }
  })

  // Transform billing history
  const transformedHistory = billingHistory.map((item) => ({
    plan: `${item.SubscriptionPlan?.name || "Desconocido"} Plan - ${formatMonthYear(item.startDate)}`,
    paidDate: `Pagado el ${item.createdAt.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`,
    amount: `${Number(item.amount).toFixed(2)} €`,
    invoiceUrl: item.invoiceUrl,
  }))

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <main className="px-4 md:px-8 pt-8 flex flex-col flex-1 pb-12">
        <AccountNav />

        {/* SUBSCRIPCIÓN Section */}
        <div className="mt-12">
          <SectionHeader title="SUBSCRIPCIÓN" />

          <div className="mt-8 flex flex-col">
            {/* Current Plan Card */}
            <div className="w-full border border-[#E5E7EB] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-[33px_25px] flex flex-col justify-center items-start gap-[5px]">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className="w-[60px] h-[60px] rounded-[8px] bg-[#FA4860] flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <h3 className="text-[#F9FAFB] font-montserrat text-[24px] font-bold leading-8">
                    Plan {currentPlanName}
                  </h3>
                </div>

                {currentPlanPrice > 0 && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#FA4860] font-montserrat text-[32px] font-bold">
                      {currentPlanPrice.toFixed(0)} €
                    </span>
                    <span className="text-[#6B7280] font-montserrat text-[14px] font-normal">/ mensual</span>
                  </div>
                )}
              </div>

              <div className="ml-[76px] flex items-center gap-2 mt-[5px]">
                <span
                  className={`text-white text-[14px] font-medium px-3 py-1 ${
                    isActive ? "bg-[#00B1DE]" : isFreeOrNoPlan ? "bg-gray-500" : "bg-red-500"
                  }`}
                >
                  {isActive ? "Active" : isFreeOrNoPlan ? "Free" : "Expirado"}
                </span>
                {isActive && (
                  <span className="text-[#6B7280] font-montserrat text-[14px] font-normal leading-5">
                    • Se renueva automáticamente
                  </span>
                )}
              </div>

              {/* Billing Info Cards */}
              <div className="mt-[30px] w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[rgba(250,72,96,0.43)] p-4 flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-white font-montserrat text-[14px] font-medium leading-5">
                      Próxima fecha de facturación
                    </span>
                    <span className="text-white font-montserrat text-[14px] font-medium leading-5">
                      {user.subscriptionEnd ? formatDate(user.subscriptionEnd) : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="bg-[rgba(250,72,96,0.43)] p-4 flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-white font-montserrat text-[14px] font-medium leading-5">Método de pago</span>
                    <span className="text-white font-montserrat text-[14px] font-medium leading-5">
                      {billingHistory.length > 0 ? billingHistory[0].paymentGateway : "No configurado"}
                    </span>
                  </div>
                </div>

                <div className="bg-[rgba(250,72,96,0.43)] p-4 flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-white font-montserrat text-[14px] font-medium leading-5">Miembro desde</span>
                    <span className="text-white font-montserrat text-[14px] font-medium leading-5">
                      {formatMonthYear(user.joinedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="mt-[30px] flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    className="flex-shrink-0 mt-[2px]"
                  >
                    <g clipPath="url(#clip0_191_7412)">
                      <path
                        d="M9 18C11.3869 18 13.6761 17.0518 15.364 15.364C17.0518 13.6761 18 11.3869 18 9C18 6.61305 17.0518 4.32387 15.364 2.63604C13.6761 0.948212 11.3869 0 9 0C6.61305 0 4.32387 0.948212 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18ZM7.59375 11.8125H8.4375V9.5625H7.59375C7.12617 9.5625 6.75 9.18633 6.75 8.71875C6.75 8.25117 7.12617 7.875 7.59375 7.875H9.28125C9.74883 7.875 10.125 8.25117 10.125 8.71875V11.8125H10.4062C10.8738 11.8125 11.25 12.1887 11.25 12.6562C11.25 13.1238 10.8738 13.5 10.4062 13.5H7.59375C7.12617 13.5 6.75 13.1238 6.75 12.6562C6.75 12.1887 7.12617 11.8125 7.59375 11.8125ZM9 4.5C9.29837 4.5 9.58452 4.61853 9.7955 4.8295C10.0065 5.04048 10.125 5.32663 10.125 5.625C10.125 5.92337 10.0065 6.20952 9.7955 6.4205C9.58452 6.63147 9.29837 6.75 9 6.75C8.70163 6.75 8.41548 6.63147 8.2045 6.4205C7.99353 6.20952 7.875 5.92337 7.875 5.625C7.875 5.32663 7.99353 5.04048 8.2045 4.8295C8.41548 4.61853 8.70163 4.5 9 4.5Z"
                        fill="#FA4860"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_191_7412">
                        <rect width="18" height="18" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-montserrat text-[14px] font-medium leading-5">
                      Información del ciclo de facturación
                    </span>
                    <span className="text-white font-montserrat text-[14px] font-normal leading-5">
                      Tu suscripción se renovará automáticamente el {formatDate(user.subscriptionEnd)}. Se te cobrará {currentPlanPrice.toFixed(2)} € por el próximo período de facturación. Puedes cancelar en cualquier
                      momento antes de la fecha de renovación.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Table */}
            <div className="mt-[70px] w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {transformedPlans.map((plan) => (
                  <SubscriptionPlanCard
                    key={plan.slug}
                    name={plan.name}
                    price={plan.price}
                    description={plan.description}
                    features={plan.features}
                    buttonText={plan.buttonText}
                    isCurrentPlan={plan.isCurrentPlan}
                  />
                ))}
              </div>
            </div>

            {/* Billing History */}
            <div className="mt-12 w-full">
              <div className="flex items-center justify-between mb-[30px]">
                <h3 className="text-white font-montserrat text-[20px] font-semibold leading-[28px]">
                  Historial de facturación
                </h3>
                <Link
                  href="/mi-cuenta/historial-de-pagos"
                  className="text-[#FA4860] font-montserrat text-[14px] font-normal flex items-center gap-1 hover:underline"
                >
                  Ver todo
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              </div>

              {transformedHistory.length > 0 ? (
                <div className="flex flex-col">
                  {transformedHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-4 border-b border-[#F3F4F6]"
                      style={{ background: "rgba(0, 0, 0, 0.00)" }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Checkmark */}
                        <div className="w-[40px] h-[40px] rounded-[8px] bg-[#FA4860] flex items-center justify-center p-[8px_13px]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                            <g clipPath="url(#clip0_191_7580)">
                              <path
                                d="M13.7062 3.29375C14.0968 3.68437 14.0968 4.31875 13.7062 4.70937L5.70615 12.7094C5.31553 13.1 4.68115 13.1 4.29053 12.7094L0.290527 8.70937C-0.100098 8.31875 -0.100098 7.68437 0.290527 7.29375C0.681152 6.90312 1.31553 6.90312 1.70615 7.29375L4.9999 10.5844L12.2937 3.29375C12.6843 2.90312 13.3187 2.90312 13.7093 3.29375H13.7062Z"
                                fill="white"
                              />
                            </g>
                            <defs>
                              <clipPath id="clip0_191_7580">
                                <path d="M0 0H14V16H0V0Z" fill="white" />
                              </clipPath>
                            </defs>
                          </svg>
                        </div>
                        {/* Plan info */}
                        <div className="flex flex-col">
                          <span className="text-white font-montserrat text-[16px] font-medium leading-[24px]">
                            {item.plan}
                          </span>
                          <span className="text-[#6B7280] font-montserrat text-[14px] font-normal leading-[20px]">
                            {item.paidDate}
                          </span>
                        </div>
                      </div>
                      {/* Price and download */}
                      <div className="flex flex-col items-end">
                        <span className="text-white font-montserrat text-[16px] font-medium leading-[24px]">
                          {item.amount}
                        </span>
                        {item.invoiceUrl && (
                          <a
                            href={item.invoiceUrl}
                            className="text-[#FA4860] font-montserrat text-[14px] font-normal hover:underline"
                          >
                            Descargar
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#6B7280] font-montserrat text-[14px]">
                  No hay historial de facturación disponible
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
