"use client"

import * as React from "react"
import Image from "next/image"
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

interface Banner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
  placement: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  order: number
}

const placementLabels: Record<string, string> = {
  HOME_TOP: "Home - Superior",
  HOME_MIDDLE: "Home - Medio",
  SIDEBAR: "Barra lateral",
  FOOTER: "Pie de pagina",
  VIDEO_PAGE: "Pagina de video",
  SHOP_PAGE: "Pagina de tienda",
}

export default function BannersPage() {
  const [banners, setBanners] = React.useState<Banner[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingBanner, setEditingBanner] = React.useState<Banner | null>(null)
  const [formData, setFormData] = React.useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    linkUrl: "",
    placement: "HOME_TOP",
    startDate: "",
    endDate: "",
    isActive: true,
    order: 0,
  })
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    fetchBanners()
  }, [])

  async function fetchBanners() {
    try {
      const res = await fetch("/api/admin/banners")
      const data = await res.json()
      setBanners(data.banners || [])
    } catch (error) {
      toast.error("Error al cargar banners")
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingBanner(null)
    setFormData({
      title: "",
      subtitle: "",
      imageUrl: "",
      linkUrl: "",
      placement: "HOME_TOP",
      startDate: "",
      endDate: "",
      isActive: true,
      order: 0,
    })
    setIsDialogOpen(true)
  }

  function openEditDialog(banner: Banner) {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || "",
      placement: banner.placement,
      startDate: banner.startDate ? banner.startDate.split("T")[0] : "",
      endDate: banner.endDate ? banner.endDate.split("T")[0] : "",
      isActive: banner.isActive,
      order: banner.order,
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : "/api/admin/banners"
      const method = editingBanner ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          subtitle: formData.subtitle || null,
          linkUrl: formData.linkUrl || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success(editingBanner ? "Banner actualizado" : "Banner creado")
      setIsDialogOpen(false)
      fetchBanners()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este banner?")) return

    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast.success("Banner eliminado")
      fetchBanners()
    } catch (error) {
      toast.error("Error al eliminar banner")
    }
  }

  async function toggleActive(banner: Banner) {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      })
      if (!res.ok) throw new Error("Error al actualizar")
      fetchBanners()
    } catch (error) {
      toast.error("Error al actualizar banner")
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banners</h1>
          <p className="text-muted-foreground">Gestiona los banners publicitarios</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <IconPlus className="mr-2 size-4" />
              Nuevo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg text-foreground">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "Editar Banner" : "Nuevo Banner"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Titulo *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subtitulo</label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL de Imagen *</label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL de Enlace</label>
                <Input
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ubicacion</label>
                <Select
                  value={formData.placement}
                  onValueChange={(v) => setFormData({ ...formData, placement: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(placementLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Orden</label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                  />
                  <label className="text-sm font-medium">Activo</label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                  {editingBanner ? "Guardar" : "Crear"}
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
              <TableHead>Imagen</TableHead>
              <TableHead>Titulo</TableHead>
              <TableHead>Ubicacion</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <IconLoader2 className="size-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay banners
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <div className="relative w-24 h-12">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{placementLabels[banner.placement]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {banner.startDate && new Date(banner.startDate).toLocaleDateString("es-ES")}
                    {banner.startDate && banner.endDate && " - "}
                    {banner.endDate && new Date(banner.endDate).toLocaleDateString("es-ES")}
                    {!banner.startDate && !banner.endDate && "Sin limites"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={() => toggleActive(banner)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(banner)}>
                        <IconEdit className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
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
