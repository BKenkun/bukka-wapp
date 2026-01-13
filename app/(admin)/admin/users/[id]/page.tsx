import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { IconArrowLeft, IconShield, IconBan } from "@tabler/icons-react"
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
        SubscriptionPlan: {
          select: { id: true, slug: true, name: true },
        },
        UserBadge: {
          include: { Badge: true },
        },
        Order: {
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
        SubscriptionHistory: {
          take: 10,
          orderBy: { startDate: "desc" },
          include: {
            SubscriptionPlan: {
              select: { id: true, slug: true, name: true },
            },
          },
        },
        favorites: {
          take: 5,
          include: {
            Video: { select: { id: true, title: true, thumbnailUrl: true } },
            Performer: { select: { id: true, name: true, profileImage: true } },
          },
        },
        _count: {
          select: {
            Order: true,
            favorites: true,
            Comment: true,
            ForumPost: true,
          },
        },
      },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
      select: { id: true, slug: true, name: true },
    }),
  ])

  if (!user) {
    notFound()
  }

  const isExpired = user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date()

  // Transform user data for client component (camelCase expected)
  const userForForm = {
    id: user.id,
    subscriptionPlanId: user.subscriptionPlanId,
    subscriptionPlan: user.SubscriptionPlan,
    subscriptionEnd: user.subscriptionEnd,
    isAdmin: user.isAdmin,
    adminRole: user.adminRole,
    isPerformer: user.isPerformer,
    isModerator: user.isModerator,
  }

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
                  Actriz
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
              <Badge variant="outline">
                {user.SubscriptionPlan?.name || "Sin plan"}
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
            <p className="text-2xl font-bold">{user._count.Order}</p>
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
            <p className="text-2xl font-bold">{user._count.Comment}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Posts Foro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.ForumPost}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscription" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscription">Suscripcion</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion de Suscripcion</CardTitle>
              <CardDescription>
                Cambia el nivel de suscripcion o extiende la fecha de expiracion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserSubscriptionForm user={userForForm} plans={plans} />
            </CardContent>
          </Card>

          {/* Subscription History */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Suscripciones</CardTitle>
            </CardHeader>
            <CardContent>
              {user.SubscriptionHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Sin historial de suscripciones
                </p>
              ) : (
                <div className="space-y-4">
                  {user.SubscriptionHistory.map((history) => (
                      <div key={history.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <Badge variant="outline">
                            {history.SubscriptionPlan?.name || "Plan eliminado"}
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
                  ))}
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
              {user.Order.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Sin pedidos
                </p>
              ) : (
                <div className="space-y-4">
                  {user.Order.map((order) => (
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
                Badges obtenidos por suscripcion, antiguedad y logros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.UserBadge.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Sin badges
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {user.UserBadge.map((ub) => (
                    <div
                      key={ub.Badge.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                      style={{ borderColor: ub.Badge.color || undefined }}
                    >
                      <div
                        className="size-4 rounded-full"
                        style={{ backgroundColor: ub.Badge.color || "#888" }}
                      />
                      <span className="font-medium">{ub.Badge.name}</span>
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
                      {fav.Video && (
                        <>
                          <div className="aspect-video bg-muted rounded overflow-hidden mb-2">
                            {fav.Video.thumbnailUrl && (
                              <img
                                src={fav.Video.thumbnailUrl}
                                alt={fav.Video.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <p className="text-sm truncate">{fav.Video.title}</p>
                        </>
                      )}
                      {fav.Performer && (
                        <>
                          <Avatar className="size-16 mx-auto mb-2">
                            <AvatarImage src={fav.Performer.profileImage || undefined} />
                            <AvatarFallback>{fav.Performer.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm truncate">{fav.Performer.name}</p>
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
              <CardTitle>Informacion de Cuenta</CardTitle>
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
                  <p className="font-medium">{user.isFounder ? "Si" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rol de relacion</p>
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
