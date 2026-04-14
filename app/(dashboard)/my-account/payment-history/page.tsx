import { AccountNav } from "@/components/account-nav"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

function getTierDisplayName(tier: string): string {
  const tierMap: Record<string, string> = {
    VISITOR: "Visitor",
    FREE: "Free",
    SILVER: "Silver",
    GOLD: "Gold",
    PLATINUM: "Platinum",
    DIAMOND: "Diamond",
  }
  return tierMap[tier] || tier
}

// Status badge component
function StatusBadge({ status }: { status: "PAID" | "PENDING" | "FAILED" | "REFUNDED" }) {
  const styles = {
    PAID: "bg-[#DCFCE7] text-[#166534]",
    PENDING: "bg-[#FEF9C3] text-[#854D0E]",
    FAILED: "bg-[#FEE2E2] text-[#991B1B]",
    REFUNDED: "bg-[#E0E7FF] text-[#3730A3]",
  }

  const labels = {
    PAID: "Completed",
    PENDING: "Pending",
    FAILED: "Failed",
    REFUNDED: "Refunded",
  }

  return <span className={`px-3 py-1 text-[14px] font-medium ${styles[status]}`}>{labels[status]}</span>
}

// Status icon component
function StatusIcon({ status }: { status: "PAID" | "PENDING" | "FAILED" | "REFUNDED" }) {
  if (status === "PAID") {
    return (
      <div className="w-[50px] h-[50px] bg-[#DCFCE7] flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  if (status === "PENDING") {
    return (
      <div className="w-[50px] h-[50px] bg-[#FEF9C3] flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#CA8A04" strokeWidth="2" />
          <path d="M12 7V12L15 15" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }
  if (status === "REFUNDED") {
    return (
      <div className="w-[50px] h-[50px] bg-[#E0E7FF] flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 3v5h5" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-[50px] h-[50px] bg-[#FEE2E2] flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// Payment method display
function PaymentMethod({ gateway }: { gateway: string }) {
  const gatewayLower = gateway.toLowerCase()

  if (gatewayLower.includes("ccbill")) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-[#1A1F71] text-white text-[10px] font-bold px-2 py-1">CCBILL</div>
        <span className="text-[14px]" style={{ color: "var(--text-muted)" }}>Card</span>
      </div>
    )
  }
  if (gatewayLower.includes("epoch")) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-[#003087] text-white text-[10px] font-bold px-2 py-1">EPOCH</div>
        <span className="text-[14px]" style={{ color: "var(--text-muted)" }}>Card</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="#6B7280" strokeWidth="2"/>
        <line x1="1" y1="10" x2="23" y2="10" stroke="#6B7280" strokeWidth="2"/>
      </svg>
      <span className="text-[14px]" style={{ color: "var(--text-muted)" }}>{gateway}</span>
    </div>
  )
}

type Transaction = {
  id: string
  type: "subscription" | "order"
  name: string
  date: string
  amount: string
  gateway: string
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED"
  invoiceUrl?: string | null
}

export default async function HistorialDePagosPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch subscription history and orders
  const [subscriptionHistory, orders] = await Promise.all([
    prisma.subscriptionHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { SubscriptionPlan: { select: { name: true } } },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Transform to unified transaction format
  const transactions: Transaction[] = [
    ...subscriptionHistory.map((item) => ({
      id: item.id,
      type: "subscription" as const,
      name: `Subscription ${getTierDisplayName(item.SubscriptionPlan.name)}`,
      date: item.createdAt.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      amount: `${Number(item.amount).toFixed(2)} €`,
      gateway: item.paymentGateway,
      status: "PAID" as const,
      invoiceUrl: item.invoiceUrl,
    })),
    ...orders.map((order) => ({
      id: order.id,
      type: "order" as const,
      name: `Order ${order.orderNumber}`,
      date: order.createdAt.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      amount: `${Number(order.total).toFixed(2)} €`,
      gateway: order.paymentGateway || "N/A",
      status: (order.paymentStatus === "PAID"
        ? "PAID"
        : order.paymentStatus === "PENDING"
        ? "PENDING"
        : order.paymentStatus === "FAILED"
        ? "FAILED"
        : "REFUNDED") as "PAID" | "PENDING" | "FAILED" | "REFUNDED",
      invoiceUrl: null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}>
      <main className="pt-8 pb-12 flex flex-col flex-1">
        <AccountNav />

        {/* HISTORIAL DE TRANSACCIONES Section */}
        <div className="mt-8 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-montserrat text-[18px] font-semibold leading-[28px]" style={{ color: "var(--text-primary)" }}>
              Transaction History
            </h2>
          </div>

          {/* Transactions count */}
          <p className="font-montserrat text-[14px] font-normal leading-[20px] mb-6" style={{ color: "var(--text-primary)" }}>
            {transactions.length} transactions found
          </p>

          {transactions.length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              No transactions yet
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="w-full">
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 py-3 border-b border-[#E5E7EB]">
                  <span className="font-montserrat text-[12px] font-medium tracking-[0.6px]" style={{ color: "var(--text-primary)" }}>Transaction</span>
                  <span className="font-montserrat text-[12px] font-medium tracking-[0.6px]" style={{ color: "var(--text-primary)" }}>Date</span>
                  <span className="font-montserrat text-[12px] font-medium tracking-[0.6px]" style={{ color: "var(--text-primary)" }}>Amount</span>
                  <span className="font-montserrat text-[12px] font-medium tracking-[0.6px]" style={{ color: "var(--text-primary)" }}>Method</span>
                  <span className="font-montserrat text-[12px] font-medium tracking-[0.6px]" style={{ color: "var(--text-primary)" }}>Status</span>
                  <span className="font-montserrat text-[12px] font-medium tracking-[0.6px] text-right" style={{ color: "var(--text-primary)" }}>
                    Actions
                  </span>
                </div>

                {/* Table Rows */}
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 py-4 border-b border-[#F3F4F6] items-center"
                  >
                    {/* Transaction */}
                    <div className="flex items-center gap-3">
                      <StatusIcon status={transaction.status} />
                      <div className="flex flex-col">
                        <span className="font-montserrat text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>{transaction.name}</span>
                        <span className="font-montserrat text-[12px]" style={{ color: "var(--text-muted)" }}>
                          {transaction.type === "subscription" ? "Subscription" : "Shop"}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <span className="font-montserrat text-[14px]" style={{ color: "var(--text-muted)" }}>{transaction.date}</span>

                    {/* Amount */}
                    <span className="font-montserrat text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>{transaction.amount}</span>

                    {/* Method */}
                    <PaymentMethod gateway={transaction.gateway} />

                    {/* Status */}
                    <StatusBadge status={transaction.status} />

                    {/* Actions */}
                    <div className="flex items-center gap-3 justify-end">
                      {/* Download */}
                      {transaction.invoiceUrl && (
                        <a href={transaction.invoiceUrl} className="text-[#00B1DE] hover:opacity-80" title="Download invoice">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3"
                              stroke="#00B1DE"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
                      )}
                      {/* View */}
                      <button className="hover:opacity-80" style={{ color: "var(--text-muted)" }} title="View details">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                            stroke="#9CA3AF"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 pb-8">
                <span className="font-montserrat text-[14px]" style={{ color: "var(--text-muted)" }}>
                  Showing {transactions.length} transactions
                </span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
