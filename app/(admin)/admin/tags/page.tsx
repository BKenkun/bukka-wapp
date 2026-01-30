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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { IconPlus, IconEdit, IconTrash, IconLoader2 } from "@tabler/icons-react"

interface Tag {
  id: string
  slug: string
  name: string
  _count?: {
    videos: number
    products: number
  }
}

export default function TagsPage() {
  const [tags, setTags] = React.useState<Tag[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingTag, setEditingTag] = React.useState<Tag | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
  })
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      const res = await fetch("/api/admin/tags")
      const data = await res.json()
      setTags(data.tags || [])
    } catch (error) {
      toast.error("Error al cargar tags")
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingTag(null)
    setFormData({ name: "", slug: "" })
    setIsDialogOpen(true)
  }

  function openEditDialog(tag: Tag) {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      slug: tag.slug,
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingTag
        ? `/api/admin/tags/${editingTag.id}`
        : "/api/admin/tags"
      const method = editingTag ? "PATCH" : "POST"

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

      toast.success(editingTag ? "Tag actualizado" : "Tag creado")
      setIsDialogOpen(false)
      fetchTags()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este tag?")) return

    try {
      const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast.success("Tag eliminado")
      fetchTags()
    } catch (error) {
      toast.error("Error al eliminar tag")
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tags</h1>
          <p className="text-muted-foreground">Gestiona las etiquetas para videos y productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <IconPlus className="mr-2 size-4" />
              Nuevo Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="text-foreground">
            <DialogHeader>
              <DialogTitle>
                {editingTag ? "Editar Tag" : "Nuevo Tag"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del tag"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Se genera automaticamente"
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
                  {editingTag ? "Guardar" : "Crear"}
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
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Vídeos</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <IconLoader2 className="size-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay tags. Crea el primero.
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                  <TableCell>{tag._count?.videos || 0}</TableCell>
                  <TableCell>{tag._count?.products || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(tag)}
                      >
                        <IconEdit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tag.id)}
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
