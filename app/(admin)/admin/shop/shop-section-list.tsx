"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconGripVertical,
  IconPencil,
  IconToggleLeft,
  IconToggleRight,
  IconPhoto,
  IconShieldCheck,
  IconCategory,
  IconLayoutGrid,
  IconStar,
  IconQuestionMark,
  IconSpeakerphone,
  IconVideo,
  IconPlus,
  IconTrash,
  IconFileText,
  IconHeart,
  IconPlayerPlay,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShopSectionType } from "@prisma/client"
import { ShopSectionEditor } from "./shop-section-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ShopSection {
  id: string
  type: ShopSectionType
  title: string | null
  enabled: boolean
  order: number
  config: Record<string, unknown> | null
}

interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}

interface TypeConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const sectionTypeConfig: Record<string, TypeConfig> = {
  HERO: { label: "Hero", icon: IconPhoto, color: "text-purple-500" },
  TRUST_ICONS: { label: "Iconos de Confianza", icon: IconShieldCheck, color: "text-green-500" },
  FEATURED_COLLECTIONS: { label: "Colecciones Destacadas", icon: IconCategory, color: "text-blue-500" },
  PRODUCTS_GRID: { label: "Grid de Productos", icon: IconLayoutGrid, color: "text-orange-500" },
  REVIEWS: { label: "Resenas", icon: IconStar, color: "text-yellow-500" },
  FAQ: { label: "FAQ", icon: IconQuestionMark, color: "text-cyan-500" },
  CTA_BANNER: { label: "Banner CTA", icon: IconSpeakerphone, color: "text-red-500" },
  VIDEO_GRID: { label: "Grid de Videos", icon: IconVideo, color: "text-indigo-500" },
  PAGE: { label: "Página CMS", icon: IconFileText, color: "text-teal-500" },
  MODEL_PICKS: { label: "Models Recommend", icon: IconHeart, color: "text-pink-500" },
  PRODUCT_VIDEOS: { label: "Product Videos", icon: IconPlayerPlay, color: "text-rose-500" },
}

interface ShopSectionListProps {
  sections: ShopSection[]
  categories: Category[]
}

export function ShopSectionList({ sections, categories }: ShopSectionListProps) {
  const router = useRouter()
  const [editingSection, setEditingSection] = useState<ShopSection | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newType, setNewType] = useState<string>("")

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/shop-sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      })
      if (response.ok) router.refresh()
    } catch (error) {
      console.error("Error toggling section:", error)
    }
  }

  const handleSave = async (id: string, data: Partial<ShopSection>) => {
    try {
      const response = await fetch(`/api/admin/shop-sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setEditingSection(null)
        router.refresh()
      }
    } catch (error) {
      console.error("Error saving section:", error)
    }
  }

  const handleAdd = async () => {
    if (!newType) return
    try {
      const response = await fetch("/api/admin/shop-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType, config: {} }),
      })
      if (response.ok) {
        setIsAdding(false)
        setNewType("")
        router.refresh()
      }
    } catch (error) {
      console.error("Error adding section:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta seccion?")) return
    try {
      const response = await fetch(`/api/admin/shop-sections/${id}`, {
        method: "DELETE",
      })
      if (response.ok) router.refresh()
    } catch (error) {
      console.error("Error deleting section:", error)
    }
  }

  const handleReorder = async (dragIndex: number, dropIndex: number) => {
    if (dragIndex === dropIndex) return
    const newOrder = [...sections]
    const [removed] = newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, removed)

    try {
      const response = await fetch("/api/admin/shop-sections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newOrder.map((s) => s.id) }),
      })
      if (response.ok) router.refresh()
    } catch (error) {
      console.error("Error reordering sections:", error)
    }
  }

  return (
    <>
      <div className="space-y-2">
        {sections.map((section, index) => {
          const config = sectionTypeConfig[section.type]
          const Icon = config?.icon

          return (
            <div
              key={section.id}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                section.enabled
                  ? "bg-card border-border"
                  : "bg-muted/50 border-muted opacity-60"
              }`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", index.toString())
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const dragIndex = parseInt(e.dataTransfer.getData("text/plain"))
                handleReorder(dragIndex, index)
              }}
            >
              <div className="cursor-grab text-muted-foreground hover:text-foreground">
                <IconGripVertical className="size-5" />
              </div>

              <div className="flex-shrink-0">
                {Icon && <Icon className={`size-6 ${config.color}`} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {section.title || config?.label || section.type}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {config?.label}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggle(section.id, section.enabled)}
                  title={section.enabled ? "Desactivar" : "Activar"}
                >
                  {section.enabled ? (
                    <IconToggleRight className="size-5 text-green-500" />
                  ) : (
                    <IconToggleLeft className="size-5 text-muted-foreground" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSection(section)}
                >
                  <IconPencil className="size-4 mr-2" />
                  Editar
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(section.id)}
                >
                  <IconTrash className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          )
        })}

        {sections.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay secciones configuradas</p>
            <p className="text-sm mt-2">Anade secciones para personalizar la tienda</p>
          </div>
        )}
      </div>

      {/* Add Section */}
      <div className="mt-4 flex items-center gap-2">
        {isAdding ? (
          <div className="flex items-center gap-2 w-full">
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Tipo de seccion" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sectionTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!newType} size="sm">
              Crear
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setNewType("") }}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsAdding(true)}>
            <IconPlus className="size-4 mr-2" />
            Anadir seccion
          </Button>
        )}
      </div>

      {editingSection && (
        <ShopSectionEditor
          section={editingSection}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditingSection(null)}
        />
      )}
    </>
  )
}
