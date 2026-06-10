"use client"

import * as React from "react"
import { IconLoader2, IconPlus, IconTrash, IconGripVertical, IconChevronDown } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import * as Collapsible from "@radix-ui/react-collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

interface BannerConfig {
  planId: string
  enabled: boolean
  text: string
  buttonText: string
  buttonUrl: string
  backgroundColor: string
  height?: number | null
  startDate?: string | null
  endDate?: string | null
}

interface Plan {
  id: string
  name: string
  slug: string
  level: number
}

const EMPTY_BANNER: Omit<BannerConfig, "planId"> = {
  enabled: true,
  text: "",
  buttonText: "",
  buttonUrl: "/registro",
  backgroundColor: "#00B1DE",
  height: null,
  startDate: null,
  endDate: null,
}

export function DiscountBannerSettings() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [banners, setBanners] = React.useState<BannerConfig[]>([])
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [bannersRes, plansRes] = await Promise.all([
        fetch("/api/admin/settings/discount-banners"),
        fetch("/api/admin/subscription-plans"),
      ])

      if (bannersRes.ok) {
        const data = await bannersRes.json()
        setBanners(data.banners || [])
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.plans || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings/discount-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners }),
      })

      if (!response.ok) throw new Error("Error al guardar")
      toast.success("Banners guardados correctamente")
    } catch {
      toast.error("Error al guardar los banners")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddBanner = () => {
    const configuredIds = new Set(banners.map((b) => b.planId))
    if (!selectedPlanId || configuredIds.has(selectedPlanId)) return
    setBanners((prev) => [...prev, { ...EMPTY_BANNER, planId: selectedPlanId }])
    setSelectedPlanId("")
  }

  const handleRemoveBanner = (planId: string) => {
    setBanners((prev) => prev.filter((b) => b.planId !== planId))
  }

  const updateBanner = (
    planId: string,
    field: keyof Omit<BannerConfig, "planId">,
    value: string | boolean | number | null
  ) => {
    setBanners((prev) =>
      prev.map((b) => (b.planId === planId ? { ...b, [field]: value } : b))
    )
  }

  const getPlanName = (planId: string) => {
    if (planId === "guest") return "Invitados (sin cuenta)"
    return plans.find((p) => p.id === planId)?.name || planId
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setBanners((prev) => {
      const oldIndex = prev.findIndex((b) => b.planId === active.id)
      const newIndex = prev.findIndex((b) => b.planId === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const configuredPlanIds = new Set(banners.map((b) => b.planId))
  const availablePlans = [
    { id: "guest", name: "Invitados (sin cuenta)", slug: "guest", level: -1 },
    ...plans,
  ].filter((p) => !configuredPlanIds.has(p.id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Banners de Descuento por Plan</CardTitle>
          <CardDescription>
            Configura un banner promocional diferente para cada plan de suscripción.
            Los usuarios verán el banner correspondiente a su plan actual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add new banner */}
          {availablePlans.length > 0 && (
            <div className="flex items-end gap-3 p-4 rounded-lg border border-dashed">
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm font-medium">Añadir banner para plan</Label>
                <Select
                  value={selectedPlanId && !configuredPlanIds.has(selectedPlanId) ? selectedPlanId : ""}
                  onValueChange={setSelectedPlanId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddBanner}
                disabled={!selectedPlanId || configuredPlanIds.has(selectedPlanId)}
              >
                <IconPlus className="size-4 mr-2" />
                Añadir
              </Button>
            </div>
          )}

          {banners.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No hay banners configurados. Selecciona un plan arriba para crear el primero.
              </p>
            </div>
          )}

          {/* Sortable banner list */}
          {banners.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={banners.map((b) => b.planId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {banners.map((banner) => (
                    <SortableBannerItem
                      key={banner.planId}
                      banner={banner}
                      planName={getPlanName(banner.planId)}
                      onUpdate={(field, value) => updateBanner(banner.planId, field, value)}
                      onRemove={() => handleRemoveBanner(banner.planId)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {banners.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            Guardar Banners
          </Button>
        </div>
      )}
    </div>
  )
}

function SortableBannerItem({
  banner,
  planName,
  onUpdate,
  onRemove,
}: {
  banner: BannerConfig
  planName: string
  onUpdate: (field: keyof Omit<BannerConfig, "planId">, value: string | boolean | number | null) => void
  onRemove: () => void
}) {
  const [open, setOpen] = React.useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.planId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-80" : ""}>
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <div className="border rounded-lg overflow-hidden bg-card">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 h-14">
            {/* Drag handle */}
            <div
              className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none shrink-0"
              {...attributes}
              {...listeners}
            >
              <IconGripVertical className="size-5" />
            </div>

            {/* Color dot */}
            <div
              className="size-3.5 rounded-full shrink-0 ring-1 ring-black/10"
              style={{ backgroundColor: banner.backgroundColor }}
            />

            {/* Plan name */}
            <span className="font-semibold text-sm">{planName}</span>

            {/* Status badge */}
            <Badge variant={banner.enabled ? "default" : "secondary"}>
              {banner.enabled ? "Activo" : "Inactivo"}
            </Badge>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              <IconTrash className="size-4" />
            </Button>

            {/* Toggle */}
            <Collapsible.Trigger asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0">
                <IconChevronDown
                  className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </Button>
            </Collapsible.Trigger>
          </div>

          {/* Expanded content */}
          <Collapsible.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
            <div className="px-5 pb-5 pt-1 border-t space-y-5">
              {/* Enabled toggle */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <Label className="text-sm font-medium">Estado del banner</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {banner.enabled
                      ? "El banner se muestra a los usuarios de este plan"
                      : "El banner está oculto para este plan"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdate("enabled", !banner.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    banner.enabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      banner.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Text */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Texto del banner</Label>
                <Input
                  value={banner.text}
                  onChange={(e) => onUpdate("text", e.target.value)}
                  placeholder="DESCUENTO ESPECIAL PARA MIEMBROS -30%"
                />
              </div>

              {/* Button text + URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Texto del botón</Label>
                  <Input
                    value={banner.buttonText}
                    onChange={(e) => onUpdate("buttonText", e.target.value)}
                    placeholder="SUBSCRÍBETE AHORA"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">URL del botón</Label>
                  <Input
                    value={banner.buttonUrl}
                    onChange={(e) => onUpdate("buttonUrl", e.target.value)}
                    placeholder="/registro"
                  />
                </div>
              </div>

              {/* Altura del banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Alto de la barra (px)</Label>
                  <Input
                    type="number"
                    min="32"
                    max="150"
                    value={banner.height ?? ""}
                    onChange={(e) =>
                      onUpdate("height", e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                    placeholder="Auto"
                  />
                  <p className="text-xs text-muted-foreground">
                    Vacío = altura automática. Ej: 40 para una barra fina.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mostrar desde</Label>
                  <Input
                    type="date"
                    value={banner.startDate ?? ""}
                    onChange={(e) => onUpdate("startDate", e.target.value || null)}
                  />
                  <p className="text-xs text-muted-foreground">Opcional: programar inicio</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mostrar hasta</Label>
                  <Input
                    type="date"
                    value={banner.endDate ?? ""}
                    onChange={(e) => onUpdate("endDate", e.target.value || null)}
                  />
                  <p className="text-xs text-muted-foreground">Opcional: programar fin</p>
                </div>
              </div>

              {/* Background color */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Color de fondo</Label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={banner.backgroundColor}
                      onChange={(e) => onUpdate("backgroundColor", e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="size-10 rounded-lg ring-1 ring-black/10 cursor-pointer"
                      style={{ backgroundColor: banner.backgroundColor }}
                    />
                  </div>
                  <Input
                    value={banner.backgroundColor}
                    onChange={(e) => onUpdate("backgroundColor", e.target.value)}
                    placeholder="#00B1DE"
                    className="max-w-[140px] font-mono text-sm"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vista previa</Label>
                <div
                  className="w-full py-3.5 px-5 flex flex-col md:flex-row items-center justify-between gap-3 rounded-lg"
                  style={{ backgroundColor: banner.backgroundColor }}
                >
                  <span className="text-white font-bold text-sm uppercase tracking-wide text-center md:text-left">
                    {banner.text || "Texto del banner"}
                  </span>
                  <span className="border-2 border-white text-white px-5 py-1.5 font-bold text-xs uppercase whitespace-nowrap rounded cursor-default">
                    {banner.buttonText || "Botón"}
                  </span>
                </div>
              </div>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible.Root>
    </div>
  )
}
