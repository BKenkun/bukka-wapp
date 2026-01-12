"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconLoader2,
  IconCurrencyEuro,
  IconDeviceFloppy,
} from "@tabler/icons-react"

interface Props {
  params: Promise<{ id: string }>
}

export default function EditSubscriptionPage({ params }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [planId, setPlanId] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    slug: "",
    name: "",
    description: "",
    level: 0,
    icon: "",
    monthlyPrice: 0,
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
  })

  React.useEffect(() => {
    async function loadPlan() {
      const { id } = await params
      setPlanId(id)

      try {
        const res = await fetch(`/api/admin/subscription-plans/${id}`)
        if (!res.ok) {
          toast.error("Plan no encontrado")
          router.push("/admin/subscriptions")
          return
        }

        const data = await res.json()
        const plan = data.plan

        setFormData({
          slug: plan.slug,
          name: plan.name,
          description: plan.description || "",
          level: plan.level,
          icon: plan.icon || "",
          monthlyPrice: Number(plan.monthlyPrice),
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
      } catch (error) {
        toast.error("Error al cargar el plan")
        router.push("/admin/subscriptions")
      } finally {
        setIsLoading(false)
      }
    }

    loadPlan()
  }, [params, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!planId) return

    setIsSaving(true)

    try {
      const payload = {
        slug: formData.slug,
        name: formData.name,
        description: formData.description || null,
        level: formData.level,
        icon: formData.icon || null,
        monthlyPrice: formData.monthlyPrice,
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

      const res = await fetch(`/api/admin/subscription-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success("Plan actualizado")
      router.push("/admin/subscriptions")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/subscriptions">
              <IconArrowLeft className="mr-2 size-4" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Plan: {formData.name}</h1>
            <p className="text-muted-foreground text-sm">
              Modifica los detalles del plan de suscripción
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/subscriptions">Cancelar</Link>
          </Button>
          <Button type="submit" form="subscription-form" disabled={isSaving}>
            {isSaving ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="mr-2 size-4" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>

      <form id="subscription-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCurrencyEuro className="size-5" />
                  Precios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyPrice">Mensual (€)</Label>
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
                    <Label htmlFor="yearlyPrice">Anual (€)</Label>
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
              </CardContent>
            </Card>

            {/* Video & Shop */}
            <Card>
              <CardHeader>
                <CardTitle>Video y Tienda</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle>Permisos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="canComment">Comentarios</Label>
                  <Switch
                    id="canComment"
                    checked={formData.canComment}
                    onCheckedChange={(v) => setFormData({ ...formData, canComment: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canAccessForum">Foro</Label>
                  <Switch
                    id="canAccessForum"
                    checked={formData.canAccessForum}
                    onCheckedChange={(v) => setFormData({ ...formData, canAccessForum: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canDownload">Descargas</Label>
                  <Switch
                    id="canDownload"
                    checked={formData.canDownload}
                    onCheckedChange={(v) => setFormData({ ...formData, canDownload: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canAccessLimitedEdition">Edición Limitada</Label>
                  <Switch
                    id="canAccessLimitedEdition"
                    checked={formData.canAccessLimitedEdition}
                    onCheckedChange={(v) => setFormData({ ...formData, canAccessLimitedEdition: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canAccessExclusive">Exclusivos</Label>
                  <Switch
                    id="canAccessExclusive"
                    checked={formData.canAccessExclusive}
                    onCheckedChange={(v) => setFormData({ ...formData, canAccessExclusive: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includesVIPPack">Pack VIP</Label>
                  <Switch
                    id="includesVIPPack"
                    checked={formData.includesVIPPack}
                    onCheckedChange={(v) => setFormData({ ...formData, includesVIPPack: v })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <Separator />
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
                <Separator />
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
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
