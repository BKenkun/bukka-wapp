"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { IconLoader2, IconPlus, IconTrash, IconTag } from "@tabler/icons-react"

interface BlogCategory {
  id: string
  slug: string
  name: string
  description: string | null
  order: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function BlogCategoriesManager({ onChanged }: { onChanged?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [categories, setCategories] = React.useState<BlogCategory[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/blog-categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch {
      toast.error("Error al cargar categorías")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) loadCategories()
  }, [open, loadCategories])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setIsCreating(true)
    try {
      const res = await fetch("/api/admin/blog-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slugify(name) }),
      })
      if (!res.ok) throw new Error()
      toast.success("Categoría creada")
      setNewName("")
      await loadCategories()
      onChanged?.()
    } catch {
      toast.error("Error al crear la categoría")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blog-categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Categoría eliminada")
      await loadCategories()
      onChanged?.()
    } catch {
      toast.error("Error al eliminar la categoría")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <IconTag className="mr-2 size-4" />
          Categorías
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Categorías del Blog</DialogTitle>
          <DialogDescription>
            Crea y gestiona las categorías. Después asígnalas a cada artículo desde su editor.
          </DialogDescription>
        </DialogHeader>

        {/* Crear nueva */}
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleCreate()
              }
            }}
            placeholder="Nombre de la nueva categoría"
            disabled={isCreating}
          />
          <Button onClick={handleCreate} disabled={isCreating || !newName.trim()}>
            {isCreating ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconPlus className="size-4" />
            )}
          </Button>
        </div>

        {/* Lista */}
        <div className="max-h-[320px] overflow-y-auto space-y-1 mt-2">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay categorías todavía. Crea la primera arriba.
            </p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">/{cat.slug}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(cat.id)}
                >
                  <IconTrash className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
