"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  IconEdit,
  IconLoader2,
  IconUsers,
  IconCrown,
  IconSearch,
  IconCalendar,
  IconShoppingCart,
  IconEye,
  IconMessage,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"

interface SubscriptionPlan {
  id: string
  slug: string
  name: string
  description: string | null
  level: number
  icon: string | null
  monthlyPrice: number
  yearlyPrice: number | null
  features: unknown
  maxVideoQuality: string
  canComment: boolean
  canAccessForum: boolean
  canDownload: boolean
  canAccessLimitedEdition: boolean
  canAccessExclusive: boolean
  shopDiscount: number
  includesVIPPack: boolean
  isDefault: boolean
  isActive: boolean
  isFree: boolean
  userCount: number
}

interface User {
  id: string
  name: string | null
  email: string
  username: string | null
  image: string | null
  subscriptionPlanId: string | null
  subscriptionPlan: {
    name: string
    slug: string
  } | null
  subscriptionStart: string | null
  subscriptionEnd: string | null
  createdAt: string
  isVerified: boolean
  _count: {
    orders: number
    watchHistory: number
    comments: number
  }
}

interface Stats {
  totalUsers: number
  paidSubscribers: number
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([])
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [planToDelete, setPlanToDelete] = React.useState<SubscriptionPlan | null>(null)

  // Users sheet state
  const [isUsersSheetOpen, setIsUsersSheetOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null)
  const [users, setUsers] = React.useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [userSearch, setUserSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [nextCursor, setNextCursor] = React.useState<string | null>(null)
  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(userSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch])

  // Reset and fetch when search changes
  React.useEffect(() => {
    if (isUsersSheetOpen && selectedPlan) {
      setUsers([])
      setNextCursor(null)
      fetchUsersByPlan(selectedPlan.id, null, debouncedSearch)
    }
  }, [debouncedSearch])

  React.useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    try {
      const res = await fetch("/api/admin/subscription-plans")
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("No autorizado. Por favor, cierra sesión y vuelve a iniciar sesión.")
        } else {
          toast.error(data.error || "Error al cargar planes")
        }
        return
      }

      setPlans(data.plans || [])
      setStats(data.stats || null)
    } catch (error) {
      toast.error("Error al cargar planes")
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchUsersByPlan(planId: string | null, cursor: string | null = null, search: string = "") {
    if (cursor) {
      setIsLoadingMore(true)
    } else {
      setIsLoadingUsers(true)
    }

    try {
      const params = new URLSearchParams()
      if (planId) params.set("planId", planId)
      if (cursor) params.set("cursor", cursor)
      if (search) params.set("search", search)
      params.set("limit", "20")

      const res = await fetch(`/api/admin/users-by-tier?${params}`)
      const data = await res.json()

      if (cursor) {
        setUsers(prev => [...prev, ...(data.users || [])])
      } else {
        setUsers(data.users || [])
      }
      setNextCursor(data.nextCursor || null)
    } catch (error) {
      toast.error("Error al cargar usuarios")
    } finally {
      setIsLoadingUsers(false)
      setIsLoadingMore(false)
    }
  }

  // Infinite scroll observer
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !isLoadingMore && selectedPlan) {
          fetchUsersByPlan(selectedPlan.id, nextCursor, debouncedSearch)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [nextCursor, isLoadingMore, selectedPlan, debouncedSearch])

  function openUsersSheet(plan: SubscriptionPlan) {
    setSelectedPlan(plan)
    setUsers([])
    setNextCursor(null)
    setUserSearch("")
    setDebouncedSearch("")
    setIsUsersSheetOpen(true)
    fetchUsersByPlan(plan.id, null, "")
  }

  function openDeleteDialog(plan: SubscriptionPlan) {
    setPlanToDelete(plan)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!planToDelete) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/admin/subscription-plans/${planToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success("Plan eliminado")
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
      fetchPlans()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suscripciones</h1>
          <p className="text-muted-foreground">
            Gestiona los planes de suscripción
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/subscriptions/new">
            <IconPlus className="mr-2 size-4" />
            Nuevo Plan
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconUsers className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Usuarios registrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <IconCrown className="size-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.paidSubscribers}</p>
                  <p className="text-sm text-muted-foreground">Suscriptores de pago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plans Table */}
      {plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <IconCrown className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay planes creados
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Crea tu primer plan de suscripción para que los usuarios puedan elegir.
            </p>
            <Button asChild>
              <Link href="/admin/subscriptions/new">
                <IconPlus className="mr-2 size-4" />
                Crear Primer Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Planes de Suscripción</CardTitle>
            <CardDescription>
              Haz clic en una fila para ver los usuarios de ese plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Precio/mes</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead className="text-center">Usuarios</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openUsersSheet(plan)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {plan.name}
                          {plan.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                          {plan.isFree && (
                            <Badge variant="outline" className="text-xs">Gratis</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">/{plan.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{Number(plan.monthlyPrice).toFixed(2)}€</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.maxVideoQuality}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {plan.userCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {plan.isActive ? (
                        <Badge className="bg-green-500">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/admin/subscriptions/${plan.id}`}>
                            <IconEdit className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(plan)
                          }}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Users Sheet */}
      <Sheet open={isUsersSheetOpen} onOpenChange={setIsUsersSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl text-foreground px-6">
          <SheetHeader className="pr-6">
            <SheetTitle>
              Usuarios - {selectedPlan?.name}
            </SheetTitle>
            <SheetDescription>
              {users.length} usuarios cargados
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4 pr-2">
            {/* Search */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Users list */}
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <IconLoader2 className="size-6 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No hay usuarios con este plan
                </p>
              ) : (
                <>
                  {users.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>
                            {user.name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {user.name || "Sin nombre"}
                            </p>
                            {user.isVerified && (
                              <Badge variant="outline" className="text-xs">Verificado</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                          {user.username && (
                            <p className="text-xs text-muted-foreground">
                              @{user.username}
                            </p>
                          )}

                          {/* User stats */}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <IconShoppingCart className="size-3" />
                              {user._count.orders} pedidos
                            </span>
                            <span className="flex items-center gap-1">
                              <IconEye className="size-3" />
                              {user._count.watchHistory} videos
                            </span>
                            <span className="flex items-center gap-1">
                              <IconMessage className="size-3" />
                              {user._count.comments} comentarios
                            </span>
                          </div>

                          {/* Subscription dates */}
                          {user.subscriptionStart && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <IconCalendar className="size-3" />
                              <span>
                                Desde {new Date(user.subscriptionStart).toLocaleDateString()}
                              </span>
                              {user.subscriptionEnd && (
                                <span>
                                  · Hasta {new Date(user.subscriptionEnd).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Infinite scroll trigger */}
                  <div ref={loadMoreRef} className="py-2">
                    {isLoadingMore && (
                      <div className="flex items-center justify-center">
                        <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El plan &quot;{planToDelete?.name}&quot; será eliminado permanentemente.
              {planToDelete && planToDelete.userCount > 0 && (
                <span className="block mt-2 text-red-500 font-medium">
                  Nota: Este plan tiene {planToDelete.userCount} usuarios activos y no puede ser eliminado.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || (planToDelete?.userCount ?? 0) > 0}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
