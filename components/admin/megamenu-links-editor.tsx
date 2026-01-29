"use client"

import * as React from "react"
import {
  IconPlus,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MegamenuLink } from "@/types/megamenu"

interface Page {
  id: string
  title: string
  slug: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface SystemCollection {
  type: string
  slug: string
  name: string
}

interface MegamenuLinksEditorProps {
  links: MegamenuLink[]
  onChange: (links: MegamenuLink[]) => void
  pages: Page[]
  categories?: Category[]
  systemCollections?: SystemCollection[]
}

type LinkType = "url" | "page" | "category" | "system"

function getLinkType(link: MegamenuLink): LinkType {
  if (link.systemCollectionSlug) return "system"
  if (link.categoryId) return "category"
  if (link.pageId) return "page"
  return "url"
}

export function MegamenuLinksEditor({ links, onChange, pages, categories = [], systemCollections = [] }: MegamenuLinksEditorProps) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)

  const handleAddLink = () => {
    const newLink: MegamenuLink = {
      id: crypto.randomUUID(),
      label: "",
      url: "",
      openInNewTab: false,
    }
    onChange([...links, newLink])
    setEditingIndex(links.length)
  }

  const handleUpdateLink = (index: number, updates: Partial<MegamenuLink>) => {
    const newLinks = [...links]
    newLinks[index] = { ...newLinks[index], ...updates }
    onChange(newLinks)
  }

  const handleRemoveLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index))
    if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  const moveLink = (index: number, direction: "up" | "down") => {
    const newLinks = [...links]
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= links.length) return

    const temp = newLinks[index]
    newLinks[index] = newLinks[newIndex]
    newLinks[newIndex] = temp
    onChange(newLinks)
  }

  const handleLinkTypeChange = (index: number, type: LinkType) => {
    switch (type) {
      case "url":
        handleUpdateLink(index, { pageId: undefined, categoryId: undefined, systemCollectionSlug: undefined, url: "" })
        break
      case "page":
        handleUpdateLink(index, { url: undefined, categoryId: undefined, systemCollectionSlug: undefined, pageId: pages[0]?.id })
        break
      case "category":
        handleUpdateLink(index, { url: undefined, pageId: undefined, systemCollectionSlug: undefined, categoryId: categories[0]?.id })
        break
      case "system":
        handleUpdateLink(index, { url: undefined, pageId: undefined, categoryId: undefined, systemCollectionSlug: systemCollections[0]?.slug })
        break
    }
  }

  const getLinkDescription = (link: MegamenuLink): string => {
    if (link.systemCollectionSlug) {
      const collection = systemCollections.find((c) => c.slug === link.systemCollectionSlug)
      return `Colección: ${collection?.name || "..."}`
    }
    if (link.categoryId) {
      const category = categories.find((c) => c.id === link.categoryId)
      return `Categoría: ${category?.name || "..."}`
    }
    if (link.pageId) {
      const page = pages.find((p) => p.id === link.pageId)
      return `Página: ${page?.title || "..."}`
    }
    return link.url || "Sin URL"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Enlaces personalizados</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAddLink}>
          <IconPlus className="mr-2 size-4" />
          Añadir enlace
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
          <p className="text-sm">No hay enlaces configurados</p>
          <p className="text-xs">Añade enlaces como "Recomendado", "Más caliente", etc.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={link.id}
              className="border rounded-lg p-3 bg-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    onClick={() => moveLink(index, "up")}
                    disabled={index === 0}
                  >
                    <IconChevronUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    onClick={() => moveLink(index, "down")}
                    disabled={index === links.length - 1}
                  >
                    <IconChevronDown className="size-3" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {link.label || "Sin título"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getLinkDescription(link)}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                >
                  {editingIndex === index ? "Cerrar" : "Editar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRemoveLink(index)}
                >
                  <IconTrash className="size-4" />
                </Button>
              </div>

              {editingIndex === index && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="space-y-2">
                    <Label htmlFor={`link-label-${index}`}>Texto del enlace</Label>
                    <Input
                      id={`link-label-${index}`}
                      value={link.label}
                      onChange={(e) => handleUpdateLink(index, { label: e.target.value })}
                      placeholder="Ej: Más caliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de destino</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={getLinkType(link) === "url" ? "secondary" : "outline"}
                        size="sm"
                        className="justify-start"
                        onClick={() => handleLinkTypeChange(index, "url")}
                      >
                        URL
                      </Button>
                      <Button
                        type="button"
                        variant={getLinkType(link) === "page" ? "secondary" : "outline"}
                        size="sm"
                        className="justify-start"
                        onClick={() => handleLinkTypeChange(index, "page")}
                      >
                        Página
                      </Button>
                      <Button
                        type="button"
                        variant={getLinkType(link) === "category" ? "secondary" : "outline"}
                        size="sm"
                        className="justify-start"
                        onClick={() => handleLinkTypeChange(index, "category")}
                      >
                        Categoría
                      </Button>
                      {systemCollections.length > 0 && (
                        <Button
                          type="button"
                          variant={getLinkType(link) === "system" ? "secondary" : "outline"}
                          size="sm"
                          className="justify-start"
                          onClick={() => handleLinkTypeChange(index, "system")}
                        >
                          Colección
                        </Button>
                      )}
                    </div>
                  </div>

                  {getLinkType(link) === "url" && (
                    <div className="space-y-2">
                      <Label htmlFor={`link-url-${index}`}>URL</Label>
                      <Input
                        id={`link-url-${index}`}
                        value={link.url || ""}
                        onChange={(e) => handleUpdateLink(index, { url: e.target.value })}
                        placeholder="/videos/recomendados"
                      />
                    </div>
                  )}

                  {getLinkType(link) === "page" && (
                    <div className="space-y-2">
                      <Label>Página</Label>
                      <Select
                        value={link.pageId || ""}
                        onValueChange={(value) => handleUpdateLink(index, { pageId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una página" />
                        </SelectTrigger>
                        <SelectContent>
                          {pages.map((page) => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {getLinkType(link) === "category" && (
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select
                        value={link.categoryId || ""}
                        onValueChange={(value) => handleUpdateLink(index, { categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {getLinkType(link) === "system" && (
                    <div className="space-y-2">
                      <Label>Colección del sistema</Label>
                      <Select
                        value={link.systemCollectionSlug || ""}
                        onValueChange={(value) => handleUpdateLink(index, { systemCollectionSlug: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una colección" />
                        </SelectTrigger>
                        <SelectContent>
                          {systemCollections.map((collection) => (
                            <SelectItem key={collection.slug} value={collection.slug}>
                              {collection.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Las colecciones del sistema se actualizan automáticamente
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`link-newtab-${index}`} className="text-sm">
                      Abrir en nueva pestaña
                    </Label>
                    <Switch
                      id={`link-newtab-${index}`}
                      checked={link.openInNewTab}
                      onCheckedChange={(checked) => handleUpdateLink(index, { openInNewTab: checked })}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
