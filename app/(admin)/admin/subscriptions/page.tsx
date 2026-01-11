"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  IconEdit,
  IconLoader2,
  IconUsers,
  IconCrown,
  IconSearch,
  IconChevronRight,
  IconCalendar,
  IconShoppingCart,
  IconEye,
  IconMessage,
  IconPlus,
  IconTrash,
  IconCurrencyEuro,
  IconCheck,
  IconX,
} from "@tabler/icons-react"

interface SubscriptionPlan {
  id: string
  slug: string
  name: string
  description: string | null
  level: number
  color: string | null
  icon: string | null
  monthlyPrice: number
  dailyPrice: number
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
    color: string | null
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
  usersWithPlan: number
  paidSubscribers: number
  usersWithoutPlan: number
}

const defaultFormData = {
  slug: "",
  name: "",
  description: "",
  level: 0,
  color: "#6366f1",
  icon: "",
  monthlyPrice: 0,
  dailyPrice: 0,
  yearlyPrice: "",
  maxVideoQuality: "720p",
  canComment: false,
  canAccessForum: false,
  canDownload: false,
  canAccessLimitedEdition: false,
  canAccessExclusive: false,
  shopDiscount: 0,
  includesVIPPack: false,
  isDefault: false,
  isActive: true,
  isFree: false,
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([])
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingPlan, setEditingPlan] = React.useState<SubscriptionPlan | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [planToDelete, setPlanToDelete] = React.useState<SubscriptionPlan | null>(null)

  // Users sheet state
  const [isUsersSheetOpen, setIsUsersSheetOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null)
  const [users, setUsers] = React.useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false)
  const [userSearch, setUserSearch] = React.useState("")

  const [formData, setFormData] = React.useState(defaultFormData)

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

  async function fetchUsersByPlan(planId: string | null) {
    setIsLoadingUsers(true)
    try {
      const url = planId
        ? `/api/admin/users-by-tier?planId=${planId}&limit=50`
        : `/api/admin/users-by-tier?limit=50`
      const res = await fetch(url)
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      toast.error("Error al cargar usuarios")
    } finally {
      setIsLoadingUsers(false)
    }
  }

  function openUsersSheet(plan: SubscriptionPlan) {
    setSelectedPlan(plan)
    setIsUsersSheetOpen(true)
    fetchUsersByPlan(plan.id)
  }

  function openCreateDialog() {
    setEditingPlan(null)
    setFormData({
      ...defaultFormData,
      level: plans.length,
    })
    setIsDialogOpen(true)
  }

  function openEditDialog(plan: SubscriptionPlan) {
    setEditingPlan(plan)
    setFormData({
      slug: plan.slug,
      name: plan.name,
      description: plan.description || "",
      level: plan.level,
      color: plan.color || "#6366f1",
      icon: plan.icon || "",
      monthlyPrice: Number(plan.monthlyPrice),
      dailyPrice: Number(plan.dailyPrice),
      yearlyPrice: plan.yearlyPrice ? plan.yearlyPrice.toString() : "",
      maxVideoQuality: plan.maxVideoQuality || "720p",
      canComment: plan.canComment,
      canAccessForum: plan.canAccessForum,
      canDownload: plan.canDownload,
      canAccessLimitedEdition: plan.canAccessLimitedEdition,
      canAccessExclusive: plan.canAccessExclusive,
      shopDiscount: plan.shopDiscount,
      includesVIPPack: plan.includesVIPPack,
      isDefault: plan.isDefault,
      isActive: plan.isActive,
      isFree: plan.isFree,
    })
    setIsDialogOpen(true)
  }

  function openDeleteDialog(plan: SubscriptionPlan) {
    setPlanToDelete(plan)
    setDeleteDialogOpen(true)
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingPlan ? prev.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        slug: formData.slug,
        name: formData.name,
        description: formData.description || null,
        level: formData.level,
        color: formData.color || null,
        icon: formData.icon || null,
        monthlyPrice: formData.monthlyPrice,
        dailyPrice: formData.dailyPrice,
        yearlyPrice: formData.yearlyPrice ? parseFloat(formData.yearlyPrice) : null,
        features: [],
        maxVideoQuality: formData.maxVideoQuality || "720p",
        canComment: formData.canComment,
        canAccessForum: formData.canAccessForum,
        canDownload: formData.canDownload,
        canAccessLimitedEdition: formData.canAccessLimitedEdition,
        canAccessExclusive: formData.canAccessExclusive,
        shopDiscount: formData.shopDiscount,
        includesVIPPack: formData.includesVIPPack,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
        isFree: formData.isFree,
      }

      const url = editingPlan
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : "/api/admin/subscription-plans"

      const res = await fetch(url, {
        method: editingPlan ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success(editingPlan ? "Plan actualizado" : "Plan creado")
      setIsDialogOpen(false)
      fetchPlans()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
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

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.username?.toLowerCase().includes(userSearch.toLowerCase())
  )

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
            Crea y gestiona los planes de suscripción
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <IconPlus className="mr-2 size-4" />
          Nueva Suscripción
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconUsers className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Usuarios totales</p>
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <IconCheck className="size-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.usersWithPlan}</p>
                  <p className="text-sm text-muted-foreground">Con plan asignado</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <IconX className="size-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.usersWithoutPlan}</p>
                  <p className="text-sm text-muted-foreground">Sin plan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <IconCrown className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay suscripciones creadas
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Crea tu primera suscripción para que los usuarios puedan elegir un plan.
            </p>
            <Button onClick={openCreateDialog}>
              <IconPlus className="mr-2 size-4" />
              Crear Primera Suscripción
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="relative cursor-pointer transition-all hover:shadow-lg border-2"
              style={{ borderColor: plan.color || "#e5e7eb" }}
              onClick={() => openUsersSheet(plan)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${plan.color}20` || "#e5e7eb20" }}
                    >
                      <IconCrown
                        className="size-6"
                        style={{ color: plan.color || "#6b7280" }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {plan.name}
                        {plan.isDefault && (
                          <Badge variant="secondary" className="text-xs">Por defecto</Badge>
                        )}
                        {plan.isFree && (
                          <Badge variant="outline" className="text-xs">Gratis</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>/{plan.slug}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditDialog(plan)
                      }}
                    >
                      <IconEdit className="size-4" />
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
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div>
                  <p className="text-3xl font-bold">
                    {Number(plan.monthlyPrice).toFixed(2)}€
                    <span className="text-sm font-normal text-muted-foreground">/mes</span>
                  </p>
                  {plan.yearlyPrice && (
                    <p className="text-sm text-muted-foreground">
                      {Number(plan.yearlyPrice).toFixed(2)}€/año
                    </p>
                  )}
                </div>

                {/* User count */}
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: `${plan.color}10` || "#e5e7eb10" }}
                >
                  <div className="flex items-center gap-2">
                    <IconUsers
                      className="size-4"
                      style={{ color: plan.color || "#6b7280" }}
                    />
                    <span className="text-sm font-medium">Usuarios</span>
                  </div>
                  <span
                    className="text-xl font-bold"
                    style={{ color: plan.color || "#6b7280" }}
                  >
                    {plan.userCount}
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nivel</span>
                    <Badge variant="outline">{plan.level}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Calidad máx.</span>
                    <Badge variant="outline">{plan.maxVideoQuality}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Descuento tienda</span>
                    <span className="font-medium">{plan.shopDiscount}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Comentarios</span>
                    {plan.canComment ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">Sí</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  {plan.isActive ? (
                    <Badge className="bg-green-500">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </div>

                {/* Click hint */}
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2">
                  <span>Click para ver usuarios</span>
                  <IconChevronRight className="size-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Users Sheet */}
      <Sheet open={isUsersSheetOpen} onOpenChange={setIsUsersSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl text-foreground">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedPlan && (
                <IconCrown
                  className="size-6"
                  style={{ color: selectedPlan.color || "#6b7280" }}
                />
              )}
              Usuarios - {selectedPlan?.name}
            </SheetTitle>
            <SheetDescription>
              {users.length} usuarios con esta suscripción
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Users list */}
            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <IconLoader2 className="size-6 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No hay usuarios con esta suscripción
                </p>
              ) : (
                filteredUsers.map((user) => (
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
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto text-foreground">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? `Editar: ${editingPlan.name}` : "Nueva Suscripción"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan
                ? "Modifica los detalles de la suscripción"
                : "Configura una nueva suscripción"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Silver, Gold, Premium..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  placeholder="silver, gold, premium..."
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Descripción breve del plan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Nivel (jerarquía)</Label>
                <Input
                  id="level"
                  type="number"
                  min="0"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Mayor número = mejor plan</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-9 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-2">
              <Label className="text-base flex items-center gap-2">
                <IconCurrencyEuro className="size-4" />
                Precios
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyPrice" className="text-sm font-normal">Mensual (€)</Label>
                  <Input
                    id="monthlyPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyPrice" className="text-sm font-normal">Diario (€)</Label>
                  <Input
                    id="dailyPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dailyPrice}
                    onChange={(e) => setFormData({ ...formData, dailyPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearlyPrice" className="text-sm font-normal">Anual (€)</Label>
                  <Input
                    id="yearlyPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.yearlyPrice}
                    onChange={(e) => setFormData({ ...formData, yearlyPrice: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxVideoQuality">Calidad Video Máxima</Label>
                <Select
                  value={formData.maxVideoQuality}
                  onValueChange={(value) => setFormData({ ...formData, maxVideoQuality: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p HD</SelectItem>
                    <SelectItem value="1080p">1080p Full HD</SelectItem>
                    <SelectItem value="4k">4K UHD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopDiscount">Descuento Tienda (%)</Label>
                <Input
                  id="shopDiscount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.shopDiscount}
                  onChange={(e) => setFormData({ ...formData, shopDiscount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Separator />

            {/* Permissions */}
            <div className="space-y-3">
              <Label className="text-base">Permisos</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="canComment" className="text-sm font-normal">Comentarios</Label>
                  <Switch
                    id="canComment"
                    checked={formData.canComment}
                    onCheckedChange={(v) => setFormData({ ...formData, canComment: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canAccessForum" className="text-sm font-normal">Foro</Label>
                  <Switch
                    id="canAccessForum"
                    checked={formData.canAccessForum}
                    onCheckedChange={(v) => setFormData({ ...formData, canAccessForum: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canDownload" className="text-sm font-normal">Descargas</Label>
                  <Switch
                    id="canDownload"
                    checked={formData.canDownload}
                    onCheckedChange={(v) => setFormData({ ...formData, canDownload: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canAccessLimitedEdition" className="text-sm font-normal">Ed. Limitada</Label>
                  <Switch
                    id="canAccessLimitedEdition"
                    checked={formData.canAccessLimitedEdition}
                    onCheckedChange={(v) => setFormData({ ...formData, canAccessLimitedEdition: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canAccessExclusive" className="text-sm font-normal">Exclusivos</Label>
                  <Switch
                    id="canAccessExclusive"
                    checked={formData.canAccessExclusive}
                    onCheckedChange={(v) => setFormData({ ...formData, canAccessExclusive: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includesVIPPack" className="text-sm font-normal">Pack VIP</Label>
                  <Switch
                    id="includesVIPPack"
                    checked={formData.includesVIPPack}
                    onCheckedChange={(v) => setFormData({ ...formData, includesVIPPack: v })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Status Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isFree">Plan Gratuito</Label>
                  <p className="text-xs text-muted-foreground">
                    Este plan no requiere pago
                  </p>
                </div>
                <Switch
                  id="isFree"
                  checked={formData.isFree}
                  onCheckedChange={(v) => setFormData({ ...formData, isFree: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isDefault">Plan por Defecto</Label>
                  <p className="text-xs text-muted-foreground">
                    Asignado automáticamente a nuevos usuarios
                  </p>
                </div>
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Plan Activo</Label>
                  <p className="text-xs text-muted-foreground">
                    Los planes inactivos no se muestran
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                {editingPlan ? "Guardar Cambios" : "Crear Suscripción"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar suscripción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La suscripción &quot;{planToDelete?.name}&quot; será eliminada permanentemente.
              {planToDelete && planToDelete.userCount > 0 && (
                <span className="block mt-2 text-red-500 font-medium">
                  Nota: Esta suscripción tiene {planToDelete.userCount} usuarios activos y no puede ser eliminada.
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
