"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { toast } from "sonner"
import { IconPlus, IconEdit, IconTrash, IconLoader2 } from "@tabler/icons-react"

interface ForumCategory {
  id: string
  slug: string
  name: string
  description: string | null
  order: number
  minTier: string
  _count?: { posts: number }
}

export default function ForumCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = React.useState<ForumCategory[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<ForumCategory | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    description: "",
    minTier: "FREE",
  })
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch("/api/forum/categories")
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
    setFormData({ name: "", slug: "", description: "", minTier: "FREE" })
    setIsDialogOpen(true)
  }

  function openEditDialog(cat: ForumCategory) {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      minTier: cat.minTier,
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingCategory
        ? `/api/forum/categories/${editingCategory.id}`
        : "/api/forum/categories"
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
        body: JSON.stringify({ ...formData, slug }),
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

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta categoría? Los temas se quedarán sin categoría.")) return

    try {
      const res = await fetch(`/api/forum/categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast.success("Categoría eliminada")
      fetchCategories()
    } catch (error) {
      toast.error("Error al eliminar categoría")
    }
  }

  const tierColors: Record<string, string> = {
    VISITOR: "bg-gray-500",
    FREE: "bg-green-500",
    SILVER: "bg-slate-400",
    GOLD: "bg-yellow-500",
    PLATINUM: "bg-purple-500",
    DIAMOND: "bg-cyan-500",
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorías del Foro</h1>
          <p className="text-muted-foreground">Gestiona las categorías del foro</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <IconPlus className="mr-2 size-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="text-foreground">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre de la categoría"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Se genera automáticamente"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tier Mínimo</label>
                <Select
                  value={formData.minTier}
                  onValueChange={(v) => setFormData({ ...formData, minTier: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VISITOR">Visitor</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="SILVER">Silver</SelectItem>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="PLATINUM">Platinum</SelectItem>
                    <SelectItem value="DIAMOND">Diamond</SelectItem>
                  </SelectContent>
                </Select>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Tier Mínimo</TableHead>
              <TableHead>Temas</TableHead>
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
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay categorías. Crea la primera.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.order}</TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell>
                    <Badge className={tierColors[cat.minTier] || "bg-gray-500"}>
                      {cat.minTier}
                    </Badge>
                  </TableCell>
                  <TableCell>{cat._count?.posts || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(cat)}
                      >
                        <IconEdit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cat.id)}
                      >
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
