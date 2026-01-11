import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { IconArrowLeft, IconMail, IconShield, IconBan } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserSubscriptionForm } from "./user-subscription-form"

interface Props {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params

  const [user, plans] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        subscriptionPlan: true,
        badges: {
          include: { badge: true },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
        subscriptionHistory: {
          take: 10,
          orderBy: { startDate: "desc" },
          include: {
            plan: {
              select: { id: true, slug: true, name: true, color: true },
            },
          },
        },
        favorites: {
          take: 5,
          include: {
            video: { select: { id: true, title: true, thumbnailUrl: true } },
            performer: { select: { id: true, name: true, profileImage: true } },
          },
        },
        _count: {
          select: {
            orders: true,
            favorites: true,
            comments: true,
            forumPosts: true,
          },
        },
      },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
      select: { id: true, slug: true, name: true, color: true },
    }),
  ])

  if (!user) {
    notFound()
  }

  const isExpired = user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date()
  const planColor = user.subscriptionPlan?.color || "#6B7280"

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users">
              <IconArrowLeft className="mr-2 size-4" />
              Volver a Usuarios
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <IconMail className="mr-2 size-4" />
              Enviar email
            </Button>
            <Button variant="destructive" size="sm">
              <IconBan className="mr-2 size-4" />
              Suspender
            </Button>
          </div>
        </div>

        {/* User Header */}
        <div className="flex items-start gap-6">
          <Avatar className="size-20">
            <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
            <AvatarFallback className="text-2xl">
              {(user.name || user.email).substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold">{user.name || "Sin nombre"}</h2>
              {user.isAdmin && (
                <Badge className="bg-red-500/20 text-red-400">
                  <IconShield className="mr-1 size-3" />
                  Admin
                </Badge>
              )}
              {user.isPerformer && (
                <Badge className="bg-pink-500/20 text-pink-400">
                  Performer
                </Badge>
              )}
              {user.isVerified && (
                <Badge className="bg-blue-500/20 text-blue-400">
                  Verificado
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
            {user.username && (
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            )}
            <div className="flex items-center gap-4 mt-3">
              <Badge
                variant="outline"
                style={{
                  borderColor: planColor,
                  color: planColor,
                  backgroundColor: `${planColor}20`,
                }}
              >
                {user.subscriptionPlan?.name || "Sin plan"}
              </Badge>
              {user.subscriptionEnd && (
                <span className={`text-sm ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                  {isExpired
                    ? `Expirado: ${new Date(user.subscriptionEnd).toLocaleDateString("es-ES")}`
                    : `Expira: ${new Date(user.subscriptionEnd).toLocaleDateString("es-ES")}`
                  }
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Favoritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.favorites}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comentarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.comments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Posts Foro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.forumPosts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscription" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscription">Suscripción</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Suscripción</CardTitle>
              <CardDescription>
                Cambia el nivel de suscripción o extiende la fecha de expiración
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserSubscriptionForm user={user} plans={plans} />
            </CardContent>
          </Card>

          {/* Subscription History */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Suscripciones</CardTitle>
            </CardHeader>
            <CardContent>
              {user.subscriptionHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Sin historial de suscripciones
                </p>
              ) : (
                <div className="space-y-4">
                  {user.subscriptionHistory.map((history) => {
                    const historyPlanColor = history.plan?.color || "#6B7280"
                    return (
                      <div key={history.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: historyPlanColor,
                              color: historyPlanColor,
                              backgroundColor: `${historyPlanColor}20`,
                            }}
                          >
                            {history.plan?.name || "Plan eliminado"}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(history.startDate).toLocaleDateString("es-ES")}
                            {history.endDate && ` - ${new Date(history.endDate).toLocaleDateString("es-ES")}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{Number(history.amount).toFixed(2)}€</p>
                          <p className="text-xs text-muted-foreground">{history.paymentGateway}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {user.orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Sin pedidos
                </p>
              ) : (
                <div className="space-y-4">
                  {user.orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                          {order.orderNumber}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Number(order.total).toFixed(2)}€</p>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Badges del Usuario</CardTitle>
              <CardDescription>
                Badges obtenidos por suscripción, antigüedad y logros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.badges.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Sin badges
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {user.badges.map((ub) => (
                    <div
                      key={ub.badge.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                      style={{ borderColor: ub.badge.color || undefined }}
                    >
                      <div
                        className="size-4 rounded-full"
                        style={{ backgroundColor: ub.badge.color || "#888" }}
                      />
                      <span className="font-medium">{ub.badge.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Favoritos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {user.favorites.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Sin favoritos
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {user.favorites.map((fav) => (
                    <div key={fav.id} className="text-center">
                      {fav.video && (
                        <>
                          <div className="aspect-video bg-muted rounded overflow-hidden mb-2">
                            {fav.video.thumbnailUrl && (
                              <img
                                src={fav.video.thumbnailUrl}
                                alt={fav.video.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <p className="text-sm truncate">{fav.video.title}</p>
                        </>
                      )}
                      {fav.performer && (
                        <>
                          <Avatar className="size-16 mx-auto mb-2">
                            <AvatarImage src={fav.performer.profileImage || undefined} />
                            <AvatarFallback>{fav.performer.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm truncate">{fav.performer.name}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información de Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de registro</p>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email verificado</p>
                  <p className="font-medium">
                    {user.emailVerified
                      ? new Date(user.emailVerified).toLocaleDateString("es-ES")
                      : "No verificado"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Es Founder</p>
                  <p className="font-medium">{user.isFounder ? "Sí" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rol de relación</p>
                  <p className="font-medium">{user.relationshipRole || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
