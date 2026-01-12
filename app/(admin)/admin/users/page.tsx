import { prisma } from "@/lib/prisma"
import { UsersDataTable } from "./users-data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconUsers, IconUserPlus, IconCrown, IconDiamond } from "@tabler/icons-react"

interface SearchParams {
  page?: string
  pageSize?: string
  planId?: string
  search?: string
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20
  const skip = (page - 1) * pageSize

  // Build where clause for filtering
  const where: Record<string, unknown> = {}

  if (params.planId) {
    if (params.planId === "none") {
      where.subscriptionPlanId = null
    } else {
      where.subscriptionPlanId = params.planId
    }
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" as const } },
      { email: { contains: params.search, mode: "insensitive" as const } },
      { username: { contains: params.search, mode: "insensitive" as const } },
    ]
  }

  const [users, totalCount, plans, planStats] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        SubscriptionPlan: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
        _count: {
          select: {
            Order: true,
            favorites: true,
            Comment: true,
          },
        },
        UserBadge: {
          include: {
            Badge: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.user.groupBy({
      by: ["subscriptionPlanId"],
      _count: true,
    }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Get plan details for stats
  const planMap = new Map(plans.map((p) => [p.id, p]))

  // Calculate stats
  const totalUsers = planStats.reduce((sum, t) => sum + t._count, 0)
  const paidPlans = plans.filter((p) => p.slug !== "visitor" && p.slug !== "free")
  const paidUsers = planStats
    .filter((t) => t.subscriptionPlanId && paidPlans.some((p) => p.id === t.subscriptionPlanId))
    .reduce((sum, t) => sum + t._count, 0)
  const goldPlan = plans.find((p) => p.slug === "gold")
  const diamondPlan = plans.find((p) => p.slug === "diamond")
  const goldUsers = planStats.find((t) => t.subscriptionPlanId === goldPlan?.id)?._count || 0
  const diamondUsers = planStats.find((t) => t.subscriptionPlanId === diamondPlan?.id)?._count || 0

  return (
    <div className="px-4 lg:px-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconUsers className="size-4" />
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconUserPlus className="size-4" />
              Suscriptores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{paidUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0}% del total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconCrown className="size-4 text-yellow-500" />
              Gold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{goldUsers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IconDiamond className="size-4 text-cyan-500" />
              Diamond
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{diamondUsers.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Gestión de Usuarios</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} usuarios encontrados
          </p>
        </div>
      </div>

      <UsersDataTable
        users={users}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        plans={plans}
        pageSize={pageSize}
      />
    </div>
  )
}
