import { prisma } from "@/lib/prisma"
import { IconTrendingUp, IconTrendingDown, IconVideo, IconUsers, IconShoppingBag, IconReceipt } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getStats() {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalVideos,
    totalPerformers,
    totalUsers,
    totalProducts,
    totalOrders,
    pendingOrders,
    newUsersThisWeek,
    newUsersLastWeek,
    subscriptionStats,
    plans,
    recentOrders,
    pendingCasting,
  ] = await Promise.all([
    prisma.video.count(),
    prisma.performer.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { createdAt: { gte: lastWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: lastMonth, lt: lastWeek } } }),
    prisma.user.groupBy({
      by: ["subscriptionPlanId"],
      _count: true,
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.castingSubmission.count({ where: { status: "PENDING" } }),
  ])

  const userGrowth = lastWeek ? ((newUsersThisWeek - newUsersLastWeek) / (newUsersLastWeek || 1)) * 100 : 0

  // Map subscription stats with plan names
  const planMap = new Map(plans.map((p) => [p.id, p]))
  const subscriptionStatsWithNames = subscriptionStats.map((stat) => {
    const plan = stat.subscriptionPlanId ? planMap.get(stat.subscriptionPlanId) : null
    return {
      planId: stat.subscriptionPlanId,
      planName: plan?.name || "Sin plan",
      planSlug: plan?.slug || "none",
      count: stat._count,
    }
  })

  return {
    totalVideos,
    totalPerformers,
    totalUsers,
    totalProducts,
    totalOrders,
    pendingOrders,
    newUsersThisWeek,
    userGrowth,
    subscriptionStats: subscriptionStatsWithNames,
    recentOrders,
    pendingCasting,
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  const cards = [
    {
      title: "Vídeos Totales",
      value: stats.totalVideos.toLocaleString(),
      change: "+5",
      trend: "up" as const,
      description: "Vídeos publicados",
      href: "/admin/videos",
    },
    {
      title: "Actrices",
      value: stats.totalPerformers.toLocaleString(),
      change: "+2",
      trend: "up" as const,
      description: "Actrices registradas",
      href: "/admin/actrices",
    },
    {
      title: "Usuarios",
      value: stats.totalUsers.toLocaleString(),
      change: `${stats.userGrowth >= 0 ? "+" : ""}${stats.userGrowth.toFixed(1)}%`,
      trend: stats.userGrowth >= 0 ? "up" as const : "down" as const,
      description: `${stats.newUsersThisWeek} nuevos esta semana`,
      href: "/admin/users",
    },
    {
      title: "Pedidos Pendientes",
      value: stats.pendingOrders.toLocaleString(),
      change: stats.pendingOrders > 0 ? "Requiere atención" : "Todo al día",
      trend: stats.pendingOrders > 0 ? "down" as const : "up" as const,
      description: `${stats.totalOrders} pedidos totales`,
      href: "/admin/orders",
    },
  ]

  return (
    <div className="px-4 lg:px-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="@container/card hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {card.value}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    {card.trend === "up" ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />}
                    {card.change}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="text-muted-foreground">{card.description}</div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      {/* Middle Section */}
      <div className="mt-6 grid grid-cols-1 gap-6 @3xl/main:grid-cols-2">
        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Suscripciones</CardTitle>
            <CardDescription>Usuarios por nivel de suscripción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.subscriptionStats.map((stat) => {
              const percentage = stats.totalUsers > 0 ? ((stat.count / stats.totalUsers) * 100).toFixed(1) : "0"
              return (
                <div key={stat.planId || "none"} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium">{stat.planName}</div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm">
                    <span className="font-medium">{stat.count}</span>
                    <span className="text-muted-foreground ml-1">({percentage}%)</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accesos directos a tareas comunes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/videos/new">
                  <IconVideo className="size-6" />
                  <span>Nuevo Video</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/actrices/new">
                  <IconUsers className="size-6" />
                  <span>Nueva Actriz</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/products/new">
                  <IconShoppingBag className="size-6" />
                  <span>Nuevo Producto</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2 relative">
                <Link href="/admin/casting">
                  <IconUsers className="size-6" />
                  <span>Ver Casting</span>
                  {stats.pendingCasting > 0 && (
                    <Badge className="absolute -top-2 -right-2">{stats.pendingCasting}</Badge>
                  )}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pedidos Recientes</CardTitle>
            <CardDescription>Últimos 5 pedidos realizados</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay pedidos aún</p>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                      <IconReceipt className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.user?.name || order.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{Number(order.total).toFixed(2)}€</p>
                    <Badge variant={order.status === "PENDING" ? "secondary" : "outline"}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
