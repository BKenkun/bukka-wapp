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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconLink, IconFileText } from "@tabler/icons-react"
import { VideoSelector } from "@/components/admin/video-selector"
import { MuxVideoPlayer } from "@/components/mux-video-player"

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
  const [ctaTab, setCtaTab] = useState("fondo")

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

              {/* Modo de visualización: carrusel u cuadrícula */}
              <div className="space-y-2">
                <Label htmlFor="displayMode">Visualización</Label>
                <Select
                  value={(config.displayMode as string) || "carousel"}
                  onValueChange={(value) => updateConfig("displayMode", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carousel">Carrusel (scroll horizontal)</SelectItem>
                    <SelectItem value="grid">Cuadrícula (grid fijo)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  La cuadrícula muestra todos los videos a la vez; útil para destacar una categoría.
                </p>
              </div>

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
                  <Label htmlFor="columns">Columnas (en cuadrícula)</Label>
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
                    placeholder="actriz-id-1, actriz-id-2"
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
            <Tabs value={ctaTab} onValueChange={setCtaTab} className="w-full">
              <TabsList className={`grid w-full ${config.bgSource === "dbVideo" ? "grid-cols-2" : "grid-cols-3"}`}>
                {config.bgSource !== "dbVideo" && (
                  <TabsTrigger value="contenido">Contenido</TabsTrigger>
                )}
                <TabsTrigger value="fondo">Fondo</TabsTrigger>
                <TabsTrigger value="estilo">Estilo</TabsTrigger>
              </TabsList>

              {/* Tab Contenido — solo cuando NO es vídeo de la web */}
              {config.bgSource !== "dbVideo" && (
                <TabsContent value="contenido" className="space-y-4 mt-4">
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
                </TabsContent>
              )}

              {/* Tab Fondo */}
              <TabsContent value="fondo" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Fuente del fondo</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "image", label: "Imagen" },
                      { value: "uploadedVideo", label: "Video subido" },
                      { value: "dbVideo", label: "Vídeo de la web" },
                    ] as const).map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={(config.bgSource as string) === option.value ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateConfig("bgSource", option.value)
                          if (option.value === "dbVideo" && ctaTab === "contenido") {
                            setCtaTab("fondo")
                          }
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Image background */}
                {(!config.bgSource || config.bgSource === "image") && (
                  <div className="space-y-2">
                    <Label>Imagen de fondo</Label>
                    <FileDropzone
                      value={(config.backgroundImage as string) || null}
                      onChange={(url) => updateConfig("backgroundImage", url || "")}
                      accept="image"
                      folder="cta"
                      placeholder="Arrastra una imagen de fondo aquí"
                    />
                  </div>
                )}

                {/* Uploaded video background */}
                {config.bgSource === "uploadedVideo" && (
                  <div className="space-y-2">
                    <Label>Video de fondo</Label>
                    <FileDropzone
                      value={(config.videoUrl as string) || null}
                      onChange={(url) => updateConfig("videoUrl", url || "")}
                      accept="video"
                      folder="cta"
                      placeholder="Arrastra un video aquí (autoplay, sin sonido)"
                    />
                  </div>
                )}

                {/* DB Video selector */}
                {config.bgSource === "dbVideo" && (
                  <div className="space-y-2">
                    <Label>Seleccionar vídeo</Label>
                    <VideoSelector
                      value={config.dbVideoId ? [config.dbVideoId as string] : []}
                      onChange={(ids) => {
                        if (ids.length === 0) {
                          updateMultipleConfig({
                            dbVideoId: null,
                            dbVideoSlug: null,
                            dbVideoTitle: null,
                            dbVideoThumbnail: null,
                            dbVideoMuxPlaybackId: null,
                          })
                          return
                        }
                        // Take only the last selected (single mode)
                        const selectedId = ids[ids.length - 1]
                        // Fetch video details
                        fetch(`/api/admin/videos/search?ids=${selectedId}`)
                          .then((res) => res.json())
                          .then((data) => {
                            const video = data.videos?.[0]
                            if (video) {
                              updateMultipleConfig({
                                dbVideoId: video.id,
                                dbVideoSlug: video.slug,
                                dbVideoTitle: video.title,
                                dbVideoThumbnail: video.thumbnailUrl,
                                dbVideoMuxPlaybackId: video.muxPlaybackId,
                                title: video.title,
                                buttonText: "Ver Vídeo",
                                buttonUrl: `/videos/${video.slug}`,
                              })
                            }
                          })
                      }}
                      placeholder="Buscar vídeo por título..."
                    />
                    {!!config.dbVideoId && !!config.dbVideoSlug && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {String(config.dbVideoTitle)}
                        </p>
                        {config.dbVideoMuxPlaybackId ? (
                          <div className="rounded-md overflow-hidden border">
                            <MuxVideoPlayer
                              videoId={config.dbVideoId as string}
                              videoSlug={config.dbVideoSlug as string}
                              playbackId={config.dbVideoMuxPlaybackId as string}
                              title={String(config.dbVideoTitle)}
                              thumbnailUrl={(config.dbVideoThumbnail as string) || undefined}
                              autoPlay
                              muted
                              loop
                            />
                          </div>
                        ) : config.dbVideoThumbnail ? (
                          <div className="relative w-full h-32 rounded-md overflow-hidden border">
                            <img
                              src={config.dbVideoThumbnail as string}
                              alt={String(config.dbVideoTitle)}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>
                    )}
                    {/* Contenido editable cuando hay vídeo seleccionado */}
                    {!!config.dbVideoId && (
                      <div className="space-y-4 pt-3 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="ctaTitleDb">Título</Label>
                          <Input
                            id="ctaTitleDb"
                            value={(config.title as string) || ""}
                            onChange={(e) => updateConfig("title", e.target.value)}
                            placeholder="Título del banner"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="descriptionDb">Descripción (opcional)</Label>
                          <Textarea
                            id="descriptionDb"
                            value={(config.description as string) || ""}
                            onChange={(e) => updateConfig("description", e.target.value)}
                            placeholder="Texto adicional bajo el título..."
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="buttonTextDb">Texto del botón</Label>
                            <Input
                              id="buttonTextDb"
                              value={(config.buttonText as string) || ""}
                              onChange={(e) => updateConfig("buttonText", e.target.value)}
                              placeholder="Ver Vídeo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="buttonUrlDb">URL del botón</Label>
                            <Input
                              id="buttonUrlDb"
                              value={(config.buttonUrl as string) || ""}
                              onChange={(e) => updateConfig("buttonUrl", e.target.value)}
                              placeholder="/videos/slug"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Overlay controls */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="overlayEnabled">Overlay oscuro</Label>
                      <p className="text-xs text-muted-foreground">
                        Oscurecer el fondo para mejorar la legibilidad
                      </p>
                    </div>
                    <Switch
                      id="overlayEnabled"
                      checked={(config.overlayEnabled as boolean) ?? true}
                      onCheckedChange={(checked) => updateConfig("overlayEnabled", checked)}
                    />
                  </div>
                  {(config.overlayEnabled ?? true) && (
                    <div className="space-y-2">
                      <Label htmlFor="overlayOpacity">Intensidad del overlay ({((config.overlayOpacity as number) ?? 0.5).toFixed(1)})</Label>
                      <input
                        id="overlayOpacity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={(config.overlayOpacity as number) ?? 0.5}
                        onChange={(e) => updateConfig("overlayOpacity", parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 (sin overlay)</span>
                        <span>1 (negro total)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Blur controls */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="blurEnabled">Desenfoque</Label>
                      <p className="text-xs text-muted-foreground">
                        Difuminar el fondo para destacar el contenido
                      </p>
                    </div>
                    <Switch
                      id="blurEnabled"
                      checked={(config.blurEnabled as boolean) ?? false}
                      onCheckedChange={(checked) => updateConfig("blurEnabled", checked)}
                    />
                  </div>
                  {!!config.blurEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="blurIntensity">Intensidad ({(config.blurIntensity as number) ?? 4}px)</Label>
                      <input
                        id="blurIntensity"
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={(config.blurIntensity as number) ?? 4}
                        onChange={(e) => updateConfig("blurIntensity", parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1px (sutil)</span>
                        <span>20px (muy difuso)</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab Estilo */}
              <TabsContent value="estilo" className="space-y-4 mt-4">
                {/* Banner height */}
                <div className="space-y-2">
                  <Label htmlFor="bannerHeight">Banner Height ({(config.height as number) || 486}px)</Label>
                  <input
                    id="bannerHeight"
                    type="range"
                    min="200"
                    max="900"
                    step="10"
                    value={(config.height as number) || 486}
                    onChange={(e) => updateConfig("height", parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>200px</span>
                    <span>900px</span>
                  </div>
                </div>

                {/* Content position */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Content Position</Label>
                  <div className="grid grid-cols-3 gap-1 w-[180px]">
                    {[
                      { value: "top-left", label: "↖" },
                      { value: "top-center", label: "↑" },
                      { value: "top-right", label: "↗" },
                      { value: "center-left", label: "←" },
                      { value: "center", label: "●" },
                      { value: "center-right", label: "→" },
                      { value: "bottom-left", label: "↙" },
                      { value: "bottom-center", label: "↓" },
                      { value: "bottom-right", label: "↘" },
                    ].map((pos) => (
                      <Button
                        key={pos.value}
                        type="button"
                        variant={(config.contentPosition as string || "center") === pos.value ? "secondary" : "outline"}
                        size="sm"
                        className="h-10 text-lg"
                        onClick={() => updateConfig("contentPosition", pos.value)}
                      >
                        {pos.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Title typography */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium">Title Typography</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="titleFontFamily" className="text-xs text-muted-foreground">Fuente</Label>
                      <Select
                        value={(config.titleFontFamily as string) || "Montserrat"}
                        onValueChange={(value) => updateConfig("titleFontFamily", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                          <SelectItem value="Oswald">Oswald</SelectItem>
                          <SelectItem value="Bebas Neue">Bebas Neue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="titleFontSize" className="text-xs text-muted-foreground">Tamaño (px)</Label>
                      <Input
                        id="titleFontSize"
                        type="number"
                        min={16}
                        max={72}
                        value={(config.titleFontSize as number) || 40}
                        onChange={(e) => updateConfig("titleFontSize", parseInt(e.target.value) || 40)}
                      />
                    </div>
                  </div>
                </div>

                {/* Button colors */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium">Colores del botón</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Fondo</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={(config.buttonBgColor as string) || "#FA4860"}
                          onChange={(e) => updateConfig("buttonBgColor", e.target.value)}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={(config.buttonBgColor as string) || "#FA4860"}
                          onChange={(e) => updateConfig("buttonBgColor", e.target.value)}
                          placeholder="#FA4860"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Fondo hover</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={(config.buttonHoverColor as string) || "#e03e54"}
                          onChange={(e) => updateConfig("buttonHoverColor", e.target.value)}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={(config.buttonHoverColor as string) || "#e03e54"}
                          onChange={(e) => updateConfig("buttonHoverColor", e.target.value)}
                          placeholder="#e03e54"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Texto</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={(config.buttonTextColor as string) || "#FFFFFF"}
                          onChange={(e) => updateConfig("buttonTextColor", e.target.value)}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={(config.buttonTextColor as string) || "#FFFFFF"}
                          onChange={(e) => updateConfig("buttonTextColor", e.target.value)}
                          placeholder="#FFFFFF"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Texto hover</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={(config.buttonHoverTextColor as string) || "#FFFFFF"}
                          onChange={(e) => updateConfig("buttonHoverTextColor", e.target.value)}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={(config.buttonHoverTextColor as string) || "#FFFFFF"}
                          onChange={(e) => updateConfig("buttonHoverTextColor", e.target.value)}
                          placeholder="#FFFFFF"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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

              {/* Overlay controls */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="countdownOverlayEnabled">Overlay oscuro</Label>
                    <p className="text-xs text-muted-foreground">
                      Oscurecer el fondo para mejorar la legibilidad
                    </p>
                  </div>
                  <Switch
                    id="countdownOverlayEnabled"
                    checked={(config.overlayEnabled as boolean) ?? true}
                    onCheckedChange={(checked) => updateConfig("overlayEnabled", checked)}
                  />
                </div>
                {(config.overlayEnabled ?? true) && (
                  <div className="space-y-2">
                    <Label htmlFor="countdownOverlayOpacity">Intensidad del overlay ({((config.overlayOpacity as number) ?? 0.6).toFixed(1)})</Label>
                    <input
                      id="countdownOverlayOpacity"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={(config.overlayOpacity as number) ?? 0.6}
                      onChange={(e) => updateConfig("overlayOpacity", parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 (sin overlay)</span>
                      <span>1 (negro total)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Blur controls */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="countdownBlurEnabled">Desenfoque</Label>
                    <p className="text-xs text-muted-foreground">
                      Difuminar el fondo para destacar el contenido
                    </p>
                  </div>
                  <Switch
                    id="countdownBlurEnabled"
                    checked={(config.blurEnabled as boolean) ?? false}
                    onCheckedChange={(checked) => updateConfig("blurEnabled", checked)}
                  />
                </div>
                {!!config.blurEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="countdownBlurIntensity">Intensidad ({(config.blurIntensity as number) ?? 4}px)</Label>
                    <input
                      id="countdownBlurIntensity"
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={(config.blurIntensity as number) ?? 4}
                      onChange={(e) => updateConfig("blurIntensity", parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1px (sutil)</span>
                      <span>20px (muy difuso)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Height */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Altura del countdown ({(config.height as number) || 500}px)</Label>
                <input
                  type="range"
                  min="200"
                  max="900"
                  step="10"
                  value={(config.height as number) || 500}
                  onChange={(e) => updateConfig("height", parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>200px</span>
                  <span>900px</span>
                </div>
              </div>

              {/* Content Position */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Posición del contenido</Label>
                <div className="grid grid-cols-3 gap-1 w-[180px]">
                  {[
                    { value: "top-left", label: "↖" },
                    { value: "top-center", label: "↑" },
                    { value: "top-right", label: "↗" },
                    { value: "center-left", label: "←" },
                    { value: "center", label: "●" },
                    { value: "center-right", label: "→" },
                    { value: "bottom-left", label: "↙" },
                    { value: "bottom-center", label: "↓" },
                    { value: "bottom-right", label: "↘" },
                  ].map((pos) => (
                    <Button
                      key={pos.value}
                      type="button"
                      variant={(config.contentPosition as string || "center") === pos.value ? "secondary" : "outline"}
                      size="sm"
                      className="h-10 text-lg"
                      onClick={() => updateConfig("contentPosition", pos.value)}
                    >
                      {pos.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Title typography */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium">Tipografía del título</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="countdownTitleFontFamily" className="text-xs text-muted-foreground">Fuente</Label>
                    <Select
                      value={(config.titleFontFamily as string) || "Montserrat"}
                      onValueChange={(value) => updateConfig("titleFontFamily", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                        <SelectItem value="Oswald">Oswald</SelectItem>
                        <SelectItem value="Bebas Neue">Bebas Neue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countdownTitleFontSize" className="text-xs text-muted-foreground">Tamaño (px)</Label>
                    <Input
                      id="countdownTitleFontSize"
                      type="number"
                      min={16}
                      max={72}
                      value={(config.titleFontSize as number) || 40}
                      onChange={(e) => updateConfig("titleFontSize", parseInt(e.target.value) || 40)}
                    />
                  </div>
                </div>
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
              <div className="space-y-2">
                <Label htmlFor="featuredDisplayMode">Visualización</Label>
                <Select
                  value={(config.displayMode as string) || "grid"}
                  onValueChange={(value) => updateConfig("displayMode", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Cuadrícula (grid fijo)</SelectItem>
                    <SelectItem value="carousel">Carrusel (scroll horizontal)</SelectItem>
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
