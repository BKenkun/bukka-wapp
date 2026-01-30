"use client"

import { useState } from "react"
import { HomeSectionType } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { IconLink, IconFileText } from "@tabler/icons-react"
import { VideoSelector } from "@/components/admin/video-selector"

interface HomeSection {
  id: string
  type: HomeSectionType
  title: string | null
  enabled: boolean
  order: number
  config: Record<string, unknown> | null
}

interface Page {
  id: string
  title: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface HomeSectionEditorProps {
  section: HomeSection
  pages: Page[]
  tags: Tag[]
  onSave: (id: string, data: Partial<HomeSection>) => Promise<void>
  onClose: () => void
}

export function HomeSectionEditor({ section, pages, tags, onSave, onClose }: HomeSectionEditorProps) {
  const [title, setTitle] = useState(section.title || "")
  const [config, setConfig] = useState<Record<string, unknown>>(
    (section.config as Record<string, unknown>) || {}
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onSave(section.id, {
      title: title || null,
      config,
    })
    setIsSaving(false)
  }

  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const updateMultipleConfig = (updates: Record<string, unknown>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Sección: {section.type}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title (for sections that have it) */}
          {section.type !== "HERO" && section.type !== "CTA_BANNER" && (
            <div className="space-y-2">
              <Label htmlFor="title">Título de la sección</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título que se mostrará encima de la sección"
              />
            </div>
          )}

          {/* HERO Config */}
          {section.type === "HERO" && (
            <>
              <div className="space-y-2">
                <Label>Imagen de fondo</Label>
                <FileDropzone
                  value={(config.backgroundImage as string) || null}
                  onChange={(url) => updateConfig("backgroundImage", url || "")}
                  accept="image"
                  folder="hero"
                  placeholder="Arrastra una imagen de fondo aquí"
                />
                <p className="text-xs text-muted-foreground">
                  Se usará como fondo si no hay video configurado
                </p>
              </div>
              <div className="space-y-2">
                <Label>Video de fondo (opcional)</Label>
                <FileDropzone
                  value={(config.videoUrl as string) || null}
                  onChange={(url) => updateConfig("videoUrl", url || "")}
                  accept="video"
                  folder="hero"
                  placeholder="Arrastra un video aquí para usarlo como fondo"
                />
                <p className="text-xs text-muted-foreground">
                  Si se sube un video, se mostrará en lugar de la imagen
                </p>
              </div>

              {/* Link Configuration */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-medium">Enlace (opcional)</Label>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Tipo de enlace</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={config.linkType === "page" ? "outline" : "secondary"}
                      className="justify-start"
                      onClick={() => {
                        updateMultipleConfig({
                          linkType: "url",
                          linkPageId: null,
                        })
                      }}
                    >
                      <IconLink className="mr-2 size-4" />
                      URL personalizada
                    </Button>
                    <Button
                      type="button"
                      variant={config.linkType === "page" ? "secondary" : "outline"}
                      className="justify-start"
                      onClick={() => {
                        updateMultipleConfig({
                          linkType: "page",
                          linkUrl: null,
                        })
                      }}
                    >
                      <IconFileText className="mr-2 size-4" />
                      Página interna
                    </Button>
                  </div>
                </div>

                {config.linkType === "page" ? (
                  <div className="space-y-2">
                    <Label>Página</Label>
                    {pages.length > 0 ? (
                      <Select
                        value={(config.linkPageId as string) || ""}
                        onValueChange={(value) => updateConfig("linkPageId", value)}
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
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay páginas publicadas disponibles
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="linkUrl">URL</Label>
                    <Input
                      id="linkUrl"
                      value={(config.linkUrl as string) || ""}
                      onChange={(e) => updateConfig("linkUrl", e.target.value)}
                      placeholder="https://... o /ruta-interna"
                    />
                    <p className="text-xs text-muted-foreground">
                      Introduce una URL externa (https://...) o una ruta interna (/videos)
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="openInNewTab">Abrir en nueva pestaña</Label>
                    <p className="text-xs text-muted-foreground">
                      El enlace se abrirá en una nueva ventana
                    </p>
                  </div>
                  <Switch
                    id="openInNewTab"
                    checked={(config.openInNewTab as boolean) || false}
                    onCheckedChange={(checked) => updateConfig("openInNewTab", checked)}
                  />
                </div>
              </div>
            </>
          )}

          {/* VIDEO_GRID Config */}
          {section.type === "VIDEO_GRID" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="source">Fuente de videos</Label>
                <Select
                  value={(config.source as string) || "latest"}
                  onValueChange={(value) => updateConfig("source", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Últimos videos</SelectItem>
                    <SelectItem value="popular">Más populares (todos)</SelectItem>
                    <SelectItem value="popular_weekly">Más vistos de la semana</SelectItem>
                    <SelectItem value="trending">Tendencias</SelectItem>
                    <SelectItem value="category">Por categoría</SelectItem>
                    <SelectItem value="tag">Por tag</SelectItem>
                    <SelectItem value="manual">Selección manual</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {config.source === "popular_weekly" && "Vídeos más vistos en los últimos 7 días"}
                  {config.source === "trending" && "Vídeos con mayor crecimiento de vistas reciente"}
                  {config.source === "tag" && "Vídeos que tengan el tag seleccionado"}
                </p>
              </div>

              {config.source === "category" && (
                <div className="space-y-2">
                  <Label htmlFor="categorySlug">Slug de categoría</Label>
                  <Input
                    id="categorySlug"
                    value={(config.categorySlug as string) || ""}
                    onChange={(e) => updateConfig("categorySlug", e.target.value)}
                    placeholder="bukkake"
                  />
                </div>
              )}

              {config.source === "tag" && (
                <div className="space-y-2">
                  <Label>Tag</Label>
                  {tags.length > 0 ? (
                    <Select
                      value={(config.tagSlug as string) || ""}
                      onValueChange={(value) => updateConfig("tagSlug", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.slug}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay tags disponibles. Crea tags en Admin → Tags
                    </p>
                  )}
                </div>
              )}

              {config.source === "manual" && (
                <div className="space-y-2">
                  <Label>Seleccionar videos</Label>
                  <VideoSelector
                    value={Array.isArray(config.videoIds) ? (config.videoIds as string[]) : []}
                    onChange={(ids) => updateConfig("videoIds", ids)}
                    placeholder="Buscar videos por título..."
                  />
                </div>
              )}

              <div className={config.source === "manual" ? "" : "grid grid-cols-2 gap-4"}>
                {config.source !== "manual" && (
                  <div className="space-y-2">
                    <Label htmlFor="limit">Número de videos</Label>
                    <Select
                      value={String((config.limit as number) || 6)}
                      onValueChange={(value) => updateConfig("limit", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 videos</SelectItem>
                        <SelectItem value="6">6 videos</SelectItem>
                        <SelectItem value="9">9 videos</SelectItem>
                        <SelectItem value="12">12 videos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="columns">Columnas</Label>
                  <Select
                    value={String((config.columns as number) || 3)}
                    onValueChange={(value) => updateConfig("columns", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 columnas</SelectItem>
                      <SelectItem value="3">3 columnas</SelectItem>
                      <SelectItem value="4">4 columnas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* ACTRESS_GRID Config */}
          {section.type === "ACTRESS_GRID" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="source">Fuente de modelos</Label>
                <Select
                  value={(config.source as string) || "featured"}
                  onValueChange={(value) => updateConfig("source", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Destacadas</SelectItem>
                    <SelectItem value="popular">Más populares</SelectItem>
                    <SelectItem value="latest">Más recientes</SelectItem>
                    <SelectItem value="manual">Selección manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.source === "manual" && (
                <div className="space-y-2">
                  <Label htmlFor="performerIds">IDs de modelos (separados por coma)</Label>
                  <Textarea
                    id="performerIds"
                    value={
                      Array.isArray(config.performerIds)
                        ? (config.performerIds as string[]).join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      updateConfig(
                        "performerIds",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder="performer-id-1, performer-id-2"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="limit">Número de modelos</Label>
                <Select
                  value={String((config.limit as number) || 10)}
                  onValueChange={(value) => updateConfig("limit", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 modelos</SelectItem>
                    <SelectItem value="10">10 modelos</SelectItem>
                    <SelectItem value="15">15 modelos</SelectItem>
                    <SelectItem value="20">20 modelos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* CTA_BANNER Config */}
          {section.type === "CTA_BANNER" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ctaTitle">Título del banner</Label>
                <Input
                  id="ctaTitle"
                  value={(config.title as string) || ""}
                  onChange={(e) => updateConfig("title", e.target.value)}
                  placeholder="BUKKAKE PARTIES"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={(config.description as string) || ""}
                  onChange={(e) => updateConfig("description", e.target.value)}
                  placeholder="Apúntate a los bukkakes más salvajes del país."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Texto del botón</Label>
                  <Input
                    id="buttonText"
                    value={(config.buttonText as string) || ""}
                    onChange={(e) => updateConfig("buttonText", e.target.value)}
                    placeholder="Ver Eventos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonUrl">URL del botón</Label>
                  <Input
                    id="buttonUrl"
                    value={(config.buttonUrl as string) || ""}
                    onChange={(e) => updateConfig("buttonUrl", e.target.value)}
                    placeholder="/eventos"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagen de fondo</Label>
                <FileDropzone
                  value={(config.backgroundImage as string) || null}
                  onChange={(url) => updateConfig("backgroundImage", url || "")}
                  accept="image"
                  folder="cta"
                  placeholder="Arrastra una imagen de fondo aquí"
                />
                <p className="text-xs text-muted-foreground">
                  Se usará como fondo si no hay video configurado
                </p>
              </div>
              <div className="space-y-2">
                <Label>Video de fondo (opcional)</Label>
                <FileDropzone
                  value={(config.videoUrl as string) || null}
                  onChange={(url) => updateConfig("videoUrl", url || "")}
                  accept="video"
                  folder="cta"
                  placeholder="Arrastra un video aquí para usarlo como fondo (autoplay, sin sonido)"
                />
                <p className="text-xs text-muted-foreground">
                  Si se sube un video, se mostrará en lugar de la imagen con autoplay y sin sonido
                </p>
              </div>
            </>
          )}

          {/* COUNTDOWN Config */}
          {section.type === "COUNTDOWN" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Fecha objetivo</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={(config.targetDate as string) || ""}
                  onChange={(e) => updateConfig("targetDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countdownTitle">Título</Label>
                <Input
                  id="countdownTitle"
                  value={(config.title as string) || ""}
                  onChange={(e) => updateConfig("title", e.target.value)}
                  placeholder="PRÓXIMO EVENTO"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={(config.subtitle as string) || ""}
                  onChange={(e) => updateConfig("subtitle", e.target.value)}
                  placeholder="Bukkake Party Barcelona"
                />
              </div>
              <div className="space-y-2">
                <Label>Imagen de fondo (opcional)</Label>
                <FileDropzone
                  value={(config.backgroundImage as string) || null}
                  onChange={(url) => updateConfig("backgroundImage", url || "")}
                  accept="image"
                  folder="countdown"
                  placeholder="Arrastra una imagen de fondo aquí"
                />
                <p className="text-xs text-muted-foreground">
                  Se usará como fondo si no hay video configurado
                </p>
              </div>
              <div className="space-y-2">
                <Label>Video de fondo (opcional)</Label>
                <FileDropzone
                  value={(config.videoUrl as string) || null}
                  onChange={(url) => updateConfig("videoUrl", url || "")}
                  accept="video"
                  folder="countdown"
                  placeholder="Arrastra un video aquí para usarlo como fondo (autoplay, sin sonido)"
                />
                <p className="text-xs text-muted-foreground">
                  Si se sube un video, se mostrará en lugar de la imagen con autoplay y sin sonido
                </p>
              </div>
            </>
          )}

          {/* CATEGORY_FEATURED Config */}
          {section.type === "CATEGORY_FEATURED" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="categoryId">ID de categoría</Label>
                <Input
                  id="categoryId"
                  value={(config.categoryId as string) || ""}
                  onChange={(e) => updateConfig("categoryId", e.target.value)}
                  placeholder="categoria-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="featuredLimit">Número de videos</Label>
                <Select
                  value={String((config.limit as number) || 6)}
                  onValueChange={(value) => updateConfig("limit", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 videos</SelectItem>
                    <SelectItem value="6">6 videos</SelectItem>
                    <SelectItem value="9">9 videos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
