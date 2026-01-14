"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconChevronDown,
  IconChevronRight,
  IconTruck,
  IconSettings,
} from "@tabler/icons-react"

interface ShippingRate {
  id: string
  name: string
  description: string | null
  price: number
  minOrderAmount: number | null
  freeShippingAmount: number | null
  minWeight: number | null
  maxWeight: number | null
  estimatedDays: number | null
  isActive: boolean
  order: number
}

interface ShippingZone {
  id: string
  name: string
  description: string | null
  countries: string[]
  postalCodes: string[]
  isActive: boolean
  order: number
  rates: ShippingRate[]
  _count?: { rates: number }
}

interface ShippingSettings {
  id: string
  freeShippingEnabled: boolean
  freeShippingThreshold: number | null
  defaultWeight: number
  enableWeightCalculation: boolean
  fallbackZoneId: string | null
}

export default function ShippingPage() {
  const [zones, setZones] = React.useState<ShippingZone[]>([])
  const [settings, setSettings] = React.useState<ShippingSettings | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  // Zone dialog
  const [isZoneDialogOpen, setIsZoneDialogOpen] = React.useState(false)
  const [editingZone, setEditingZone] = React.useState<ShippingZone | null>(null)
  const [zoneFormData, setZoneFormData] = React.useState({
    name: "",
    description: "",
    countries: "",
    postalCodes: "",
    isActive: true,
    order: 0,
  })
  const [isSaving, setIsSaving] = React.useState(false)

  // Rate dialog
  const [isRateDialogOpen, setIsRateDialogOpen] = React.useState(false)
  const [editingRate, setEditingRate] = React.useState<ShippingRate | null>(null)
  const [currentZoneId, setCurrentZoneId] = React.useState<string | null>(null)
  const [rateFormData, setRateFormData] = React.useState({
    name: "",
    description: "",
    price: "",
    freeShippingAmount: "",
    estimatedDays: "",
    isActive: true,
    order: 0,
  })

  // Settings form
  const [settingsForm, setSettingsForm] = React.useState({
    freeShippingEnabled: false,
    freeShippingThreshold: "",
    defaultWeight: "0.5",
    enableWeightCalculation: false,
    fallbackZoneId: "",
  })

  React.useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    try {
      const [zonesRes, settingsRes] = await Promise.all([
        fetch("/api/admin/shipping/zones"),
        fetch("/api/admin/shipping/settings"),
      ])

      const zonesData = await zonesRes.json()
      const settingsData = await settingsRes.json()

      setZones(zonesData.zones || [])
      if (settingsData.settings) {
        setSettings(settingsData.settings)
        setSettingsForm({
          freeShippingEnabled: settingsData.settings.freeShippingEnabled,
          freeShippingThreshold: settingsData.settings.freeShippingThreshold?.toString() || "",
          defaultWeight: settingsData.settings.defaultWeight?.toString() || "0.5",
          enableWeightCalculation: settingsData.settings.enableWeightCalculation,
          fallbackZoneId: settingsData.settings.fallbackZoneId || "",
        })
      }
    } catch {
      toast.error("Error al cargar datos de envio")
    } finally {
      setIsLoading(false)
    }
  }

  // Zone functions
  function openZoneCreateDialog() {
    setEditingZone(null)
    setZoneFormData({
      name: "",
      description: "",
      countries: "",
      postalCodes: "",
      isActive: true,
      order: 0,
    })
    setIsZoneDialogOpen(true)
  }

  function openZoneEditDialog(zone: ShippingZone) {
    setEditingZone(zone)
    setZoneFormData({
      name: zone.name,
      description: zone.description || "",
      countries: zone.countries.join(", "),
      postalCodes: zone.postalCodes.join(", "),
      isActive: zone.isActive,
      order: zone.order,
    })
    setIsZoneDialogOpen(true)
  }

  async function handleZoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingZone
        ? `/api/admin/shipping/zones/${editingZone.id}`
        : "/api/admin/shipping/zones"
      const method = editingZone ? "PATCH" : "POST"

      const countries = zoneFormData.countries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean)
      const postalCodes = zoneFormData.postalCodes
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...zoneFormData,
          countries,
          postalCodes,
          description: zoneFormData.description || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success(editingZone ? "Zona actualizada" : "Zona creada")
      setIsZoneDialogOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleZoneDelete(id: string) {
    if (!confirm("¿Eliminar esta zona y todas sus tarifas?")) return

    try {
      const res = await fetch(`/api/admin/shipping/zones/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast.success("Zona eliminada")
      fetchData()
    } catch {
      toast.error("Error al eliminar zona")
    }
  }

  // Rate functions
  function openRateCreateDialog(zoneId: string) {
    setCurrentZoneId(zoneId)
    setEditingRate(null)
    setRateFormData({
      name: "",
      description: "",
      price: "",
      freeShippingAmount: "",
      estimatedDays: "",
      isActive: true,
      order: 0,
    })
    setIsRateDialogOpen(true)
  }

  function openRateEditDialog(zoneId: string, rate: ShippingRate) {
    setCurrentZoneId(zoneId)
    setEditingRate(rate)
    setRateFormData({
      name: rate.name,
      description: rate.description || "",
      price: rate.price.toString(),
      freeShippingAmount: rate.freeShippingAmount?.toString() || "",
      estimatedDays: rate.estimatedDays?.toString() || "",
      isActive: rate.isActive,
      order: rate.order,
    })
    setIsRateDialogOpen(true)
  }

  async function handleRateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentZoneId) return
    setIsSaving(true)

    try {
      const url = editingRate
        ? `/api/admin/shipping/zones/${currentZoneId}/rates/${editingRate.id}`
        : `/api/admin/shipping/zones/${currentZoneId}/rates`
      const method = editingRate ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rateFormData.name,
          description: rateFormData.description || null,
          price: parseFloat(rateFormData.price),
          freeShippingAmount: rateFormData.freeShippingAmount
            ? parseFloat(rateFormData.freeShippingAmount)
            : null,
          estimatedDays: rateFormData.estimatedDays
            ? parseInt(rateFormData.estimatedDays)
            : null,
          isActive: rateFormData.isActive,
          order: rateFormData.order,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success(editingRate ? "Tarifa actualizada" : "Tarifa creada")
      setIsRateDialogOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRateDelete(zoneId: string, rateId: string) {
    if (!confirm("¿Eliminar esta tarifa?")) return

    try {
      const res = await fetch(`/api/admin/shipping/zones/${zoneId}/rates/${rateId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error al eliminar")
      toast.success("Tarifa eliminada")
      fetchData()
    } catch {
      toast.error("Error al eliminar tarifa")
    }
  }

  // Settings functions
  async function handleSettingsSave() {
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/shipping/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeShippingEnabled: settingsForm.freeShippingEnabled,
          freeShippingThreshold: settingsForm.freeShippingThreshold
            ? parseFloat(settingsForm.freeShippingThreshold)
            : null,
          defaultWeight: parseFloat(settingsForm.defaultWeight) || 0.5,
          enableWeightCalculation: settingsForm.enableWeightCalculation,
          fallbackZoneId: settingsForm.fallbackZoneId || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success("Configuracion guardada")
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <IconLoader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuracion de Envio</h1>
        <p className="text-muted-foreground">
          Gestiona zonas de envio, tarifas y opciones de envio gratis
        </p>
      </div>

      <Tabs defaultValue="zones">
        <TabsList>
          <TabsTrigger value="zones">
            <IconTruck className="mr-2 size-4" />
            Zonas y Tarifas
          </TabsTrigger>
          <TabsTrigger value="settings">
            <IconSettings className="mr-2 size-4" />
            Configuracion Global
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button onClick={openZoneCreateDialog}>
              <IconPlus className="mr-2 size-4" />
              Nueva Zona
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Zonas de Envio</CardTitle>
              <CardDescription>
                Define zonas por pais o codigo postal y asigna tarifas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {zones.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No hay zonas de envio. Crea la primera para definir tarifas.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Paises</TableHead>
                      <TableHead>C. Postales</TableHead>
                      <TableHead>Tarifas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones.map((zone) => (
                      <Collapsible key={zone.id} asChild open={expandedId === zone.id}>
                        <>
                          <TableRow className="border-b-0">
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6"
                                  onClick={() =>
                                    setExpandedId(expandedId === zone.id ? null : zone.id)
                                  }
                                >
                                  {expandedId === zone.id ? (
                                    <IconChevronDown className="size-4" />
                                  ) : (
                                    <IconChevronRight className="size-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell className="font-medium">{zone.name}</TableCell>
                            <TableCell>
                              {zone.countries.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {zone.countries.map((c) => (
                                    <Badge key={c} variant="outline">
                                      {c}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {zone.postalCodes.length > 0 ? (
                                <span className="text-sm">{zone.postalCodes.join(", ")}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{zone.rates.length}</TableCell>
                            <TableCell>
                              <Badge variant={zone.isActive ? "default" : "secondary"}>
                                {zone.isActive ? "Activa" : "Inactiva"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openZoneEditDialog(zone)}
                                >
                                  <IconEdit className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleZoneDelete(zone.id)}
                                >
                                  <IconTrash className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={7} className="py-4">
                                <div className="ml-6 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Tarifas de {zone.name}</h4>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openRateCreateDialog(zone.id)}
                                    >
                                      <IconPlus className="mr-1 size-3" />
                                      Agregar Tarifa
                                    </Button>
                                  </div>
                                  {zone.rates.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                      Sin tarifas. Agrega tarifas como "Estandar" o "Express".
                                    </p>
                                  ) : (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Nombre</TableHead>
                                          <TableHead>Precio</TableHead>
                                          <TableHead>Envio Gratis desde</TableHead>
                                          <TableHead>Dias estimados</TableHead>
                                          <TableHead>Estado</TableHead>
                                          <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {zone.rates.map((rate) => (
                                          <TableRow key={rate.id}>
                                            <TableCell className="font-medium">
                                              {rate.name}
                                            </TableCell>
                                            <TableCell>
                                              {Number(rate.price).toFixed(2)} EUR
                                            </TableCell>
                                            <TableCell>
                                              {rate.freeShippingAmount
                                                ? `${Number(rate.freeShippingAmount).toFixed(2)} EUR`
                                                : "-"}
                                            </TableCell>
                                            <TableCell>
                                              {rate.estimatedDays
                                                ? `${rate.estimatedDays} dias`
                                                : "-"}
                                            </TableCell>
                                            <TableCell>
                                              <Badge
                                                variant={rate.isActive ? "default" : "secondary"}
                                              >
                                                {rate.isActive ? "Activa" : "Inactiva"}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex justify-end gap-2">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="size-6"
                                                  onClick={() =>
                                                    openRateEditDialog(zone.id, rate)
                                                  }
                                                >
                                                  <IconEdit className="size-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="size-6"
                                                  onClick={() =>
                                                    handleRateDelete(zone.id, rate.id)
                                                  }
                                                >
                                                  <IconTrash className="size-3" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Envio Gratis Global</CardTitle>
              <CardDescription>
                Configura un umbral de envio gratis que aplica a todas las zonas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Activar envio gratis global</Label>
                  <p className="text-xs text-muted-foreground">
                    Envio gratis para pedidos que superen el umbral
                  </p>
                </div>
                <Switch
                  checked={settingsForm.freeShippingEnabled}
                  onCheckedChange={(checked) =>
                    setSettingsForm({ ...settingsForm, freeShippingEnabled: checked })
                  }
                />
              </div>

              {settingsForm.freeShippingEnabled && (
                <div className="space-y-2">
                  <Label>Umbral de envio gratis (EUR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settingsForm.freeShippingThreshold}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, freeShippingThreshold: e.target.value })
                    }
                    placeholder="50.00"
                    className="w-40"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pedidos con subtotal mayor o igual a este valor tendran envio gratis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuracion Avanzada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Zona por defecto</Label>
                <select
                  value={settingsForm.fallbackZoneId}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, fallbackZoneId: e.target.value })
                  }
                  className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Ninguna</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Zona a usar cuando el codigo postal/pais no coincide con ninguna
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Calculo por peso</Label>
                  <p className="text-xs text-muted-foreground">
                    Filtrar tarifas segun el peso del pedido
                  </p>
                </div>
                <Switch
                  checked={settingsForm.enableWeightCalculation}
                  onCheckedChange={(checked) =>
                    setSettingsForm({ ...settingsForm, enableWeightCalculation: checked })
                  }
                />
              </div>

              {settingsForm.enableWeightCalculation && (
                <div className="space-y-2">
                  <Label>Peso por defecto (kg)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={settingsForm.defaultWeight}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, defaultWeight: e.target.value })
                    }
                    placeholder="0.5"
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Peso a usar para productos sin peso definido
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSettingsSave} disabled={isSaving}>
            {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            Guardar Configuracion
          </Button>
        </TabsContent>
      </Tabs>

      {/* Zone Dialog */}
      <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
        <DialogContent className="text-foreground">
          <DialogHeader>
            <DialogTitle>{editingZone ? "Editar Zona" : "Nueva Zona de Envio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleZoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={zoneFormData.name}
                onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                placeholder="Ej: Espana Peninsular, Europa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={zoneFormData.description}
                onChange={(e) => setZoneFormData({ ...zoneFormData, description: e.target.value })}
                placeholder="Descripcion opcional"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Paises (codigos ISO separados por coma)</Label>
              <Input
                value={zoneFormData.countries}
                onChange={(e) => setZoneFormData({ ...zoneFormData, countries: e.target.value })}
                placeholder="ES, PT, FR"
              />
              <p className="text-xs text-muted-foreground">
                Codigos de pais ISO de 2 letras: ES (Espana), PT (Portugal), etc.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Codigos postales (separados por coma)</Label>
              <Input
                value={zoneFormData.postalCodes}
                onChange={(e) => setZoneFormData({ ...zoneFormData, postalCodes: e.target.value })}
                placeholder="28*, 29001, 30*"
              />
              <p className="text-xs text-muted-foreground">
                Usa * como comodin: "28*" coincide con 28001, 28002, etc.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={zoneFormData.order}
                  onChange={(e) =>
                    setZoneFormData({ ...zoneFormData, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={zoneFormData.isActive}
                  onCheckedChange={(checked) =>
                    setZoneFormData({ ...zoneFormData, isActive: checked })
                  }
                />
                <Label>Activa</Label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsZoneDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                {editingZone ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent className="text-foreground">
          <DialogHeader>
            <DialogTitle>{editingRate ? "Editar Tarifa" : "Nueva Tarifa"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={rateFormData.name}
                onChange={(e) => setRateFormData({ ...rateFormData, name: e.target.value })}
                placeholder="Ej: Estandar, Express"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Input
                value={rateFormData.description}
                onChange={(e) => setRateFormData({ ...rateFormData, description: e.target.value })}
                placeholder="Ej: Entrega en 3-5 dias laborables"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio (EUR) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={rateFormData.price}
                  onChange={(e) => setRateFormData({ ...rateFormData, price: e.target.value })}
                  placeholder="4.99"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Envio gratis desde (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={rateFormData.freeShippingAmount}
                  onChange={(e) =>
                    setRateFormData({ ...rateFormData, freeShippingAmount: e.target.value })
                  }
                  placeholder="50.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dias estimados</Label>
                <Input
                  type="number"
                  value={rateFormData.estimatedDays}
                  onChange={(e) =>
                    setRateFormData({ ...rateFormData, estimatedDays: e.target.value })
                  }
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={rateFormData.order}
                  onChange={(e) =>
                    setRateFormData({ ...rateFormData, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={rateFormData.isActive}
                onCheckedChange={(checked) =>
                  setRateFormData({ ...rateFormData, isActive: checked })
                }
              />
              <Label>Activa</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsRateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                {editingRate ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
