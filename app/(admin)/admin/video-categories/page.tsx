"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { IconPlus, IconLoader2 } from "@tabler/icons-react"
import { CategoriesDataTable } from "./categories-data-table"

interface VideoCategory {
  id: string
  slug: string
  name: string
  description: string | null
  order: number
  parentId: string | null
  parent?: { id: string; name: string } | null
  children?: { id: string; name: string; slug: string }[]
  _count?: { VideoCategory: number }
}

export default function VideoCategoriesPage() {
  const [categories, setCategories] = React.useState<VideoCategory[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<VideoCategory | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    description: "",
    order: 0,
    parentId: "",
  })
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/video-categories")
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      toast.error("Error al cargar categorías")
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingCategory(null)
    setFormData({ name: "", slug: "", description: "", order: 0, parentId: "" })
    setIsDialogOpen(true)
  }

  function openEditDialog(cat: VideoCategory) {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      order: cat.order,
      parentId: cat.parentId || "",
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingCategory
        ? `/api/admin/video-categories/${editingCategory.id}`
        : "/api/admin/video-categories"
      const method = editingCategory ? "PATCH" : "POST"

      // Auto-generate slug if empty
      const slug =
        formData.slug ||
        formData.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug,
          parentId: formData.parentId || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success(editingCategory ? "Categoría actualizada" : "Categoría creada")
      setIsDialogOpen(false)
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  // Filter parent categories (exclude current and its children)
  const parentOptions = categories.filter((c) => {
    if (!editingCategory) return true
    if (c.id === editingCategory.id) return false
    if (c.parentId === editingCategory.id) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorías de Video</h1>
          <p className="text-muted-foreground">
            {categories.length} categorías en total
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <IconPlus className="mr-2 size-4" />
          Nueva Categoría
        </Button>
      </div>

      <CategoriesDataTable
        categories={categories}
        onEdit={openEditDialog}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="text-foreground">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la categoría"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">/videos/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Se genera automáticamente"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentId">Categoría Padre</Label>
              <Select
                value={formData.parentId || "__none__"}
                onValueChange={(v) => setFormData({ ...formData, parentId: v === "__none__" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguna (categoría raíz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ninguna (categoría raíz)</SelectItem>
                  {parentOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Orden</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                {editingCategory ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
