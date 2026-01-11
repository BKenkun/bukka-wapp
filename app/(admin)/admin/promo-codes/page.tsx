"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { IconPlus, IconEdit, IconTrash, IconLoader2 } from "@tabler/icons-react"

interface PromoCode {
  id: string
  code: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: number
  applicableTo: "ALL" | "SUBSCRIPTIONS" | "SHOP"
  maxUses: number | null
  usedCount: number
  minPurchase: number | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
}

const applicableLabels: Record<string, string> = {
  ALL: "Todo",
  SUBSCRIPTIONS: "Suscripciones",
  SHOP: "Tienda",
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = React.useState<PromoCode[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingCode, setEditingCode] = React.useState<PromoCode | null>(null)
  const [formData, setFormData] = React.useState({
    code: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    discountValue: 0,
    applicableTo: "ALL" as "ALL" | "SUBSCRIPTIONS" | "SHOP",
    maxUses: "",
    minPurchase: "",
    startDate: "",
    endDate: "",
    isActive: true,
  })
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    fetchPromoCodes()
  }, [])

  async function fetchPromoCodes() {
    try {
      const res = await fetch("/api/admin/promo-codes")
      const data = await res.json()
      setPromoCodes(data.promoCodes || [])
    } catch (error) {
      toast.error("Error al cargar codigos")
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingCode(null)
    setFormData({
      code: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      applicableTo: "ALL",
      maxUses: "",
      minPurchase: "",
      startDate: "",
      endDate: "",
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  function openEditDialog(code: PromoCode) {
    setEditingCode(code)
    setFormData({
      code: code.code,
      discountType: code.discountType,
      discountValue: Number(code.discountValue),
      applicableTo: code.applicableTo,
      maxUses: code.maxUses?.toString() || "",
      minPurchase: code.minPurchase?.toString() || "",
      startDate: code.startDate ? code.startDate.split("T")[0] : "",
      endDate: code.endDate ? code.endDate.split("T")[0] : "",
      isActive: code.isActive,
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingCode
        ? `/api/admin/promo-codes/${editingCode.id}`
        : "/api/admin/promo-codes"
      const method = editingCode ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          applicableTo: formData.applicableTo,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          isActive: formData.isActive,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success(editingCode ? "Codigo actualizado" : "Codigo creado")
      setIsDialogOpen(false)
      fetchPromoCodes()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este codigo?")) return

    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast.success("Codigo eliminado")
      fetchPromoCodes()
    } catch (error) {
      toast.error("Error al eliminar codigo")
    }
  }

  async function toggleActive(code: PromoCode) {
    try {
      const res = await fetch(`/api/admin/promo-codes/${code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !code.isActive }),
      })
      if (!res.ok) throw new Error("Error al actualizar")
      fetchPromoCodes()
    } catch (error) {
      toast.error("Error al actualizar codigo")
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Codigos Promocionales</h1>
          <p className="text-muted-foreground">Gestiona los codigos de descuento</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <IconPlus className="mr-2 size-4" />
              Nuevo Codigo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg text-foreground">
            <DialogHeader>
              <DialogTitle>
                {editingCode ? "Editar Codigo" : "Nuevo Codigo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Codigo *</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="DESCUENTO20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo de Descuento</label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(v) => setFormData({ ...formData, discountType: v as "PERCENTAGE" | "FIXED_AMOUNT" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Porcentaje</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Cantidad Fija</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Valor {formData.discountType === "PERCENTAGE" ? "(%)" : "(€)"}
                  </label>
                  <Input
                    type="number"
                    step={formData.discountType === "PERCENTAGE" ? "1" : "0.01"}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Aplicable a</label>
                <Select
                  value={formData.applicableTo}
                  onValueChange={(v) => setFormData({ ...formData, applicableTo: v as "ALL" | "SUBSCRIPTIONS" | "SHOP" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todo</SelectItem>
                    <SelectItem value="SUBSCRIPTIONS">Solo Suscripciones</SelectItem>
                    <SelectItem value="SHOP">Solo Tienda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Usos Maximos</label>
                  <Input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Compra Minima (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    placeholder="Sin minimo"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Fecha Inicio</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha Fin</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                />
                <label className="text-sm font-medium">Activo</label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                  {editingCode ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codigo</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Aplicable a</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <IconLoader2 className="size-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : promoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay codigos promocionales
                </TableCell>
              </TableRow>
            ) : (
              promoCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-bold">{code.code}</TableCell>
                  <TableCell>
                    {code.discountType === "PERCENTAGE"
                      ? `${Number(code.discountValue)}%`
                      : `${Number(code.discountValue).toFixed(2)} €`}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{applicableLabels[code.applicableTo]}</Badge>
                  </TableCell>
                  <TableCell>
                    {code.usedCount}/{code.maxUses || "∞"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {code.startDate && new Date(code.startDate).toLocaleDateString("es-ES")}
                    {code.startDate && code.endDate && " - "}
                    {code.endDate && new Date(code.endDate).toLocaleDateString("es-ES")}
                    {!code.startDate && !code.endDate && "Sin limites"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={code.isActive} onCheckedChange={() => toggleActive(code)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(code)}>
                        <IconEdit className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(code.id)}>
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
