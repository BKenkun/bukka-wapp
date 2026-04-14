"use client"

import * as React from "react"
import { IconLoader2, IconDeviceFloppy, IconUsers, IconVideo, IconLink, IconShoppingBag } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PerformerSearch } from "@/components/admin/performer-search"
import { ProductSearch } from "@/components/admin/product-search"
import { VideoSelector } from "@/components/admin/video-selector"
import { MegamenuLinksEditor } from "@/components/admin/megamenu-links-editor"
import { toast } from "sonner"
import type { VideoSourceType } from "@prisma/client"
import type { MegamenuLink } from "@/types/megamenu"

interface Performer {
  id: string
  name: string
  slug: string
  profileImage?: string | null
}

interface Product {
  id: string
  name: string
  slug: string
  images?: string[]
}

interface VideoCategory {
  id: string
  name: string
  slug: string
}

interface Page {
  id: string
  title: string
  slug: string
}

interface SystemCollection {
  type: string
  slug: string
  name: string
}

interface MegamenuConfig {
  id?: string
  featuredPerformerIds: string[]
  featuredProductIds: string[]
  videoSource: VideoSourceType
  videoIds: string[]
  videoCategoryId: string | null
  links: MegamenuLink[]
  linksSectionTitle: string
}

interface MegamenuEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuItemId: string
  menuItemLabel: string
  initialConfig?: MegamenuConfig | null
  performers: Performer[]
  products: Product[]
  videoCategories: VideoCategory[]
  pages: Page[]
  onSave: (config: MegamenuConfig) => Promise<void>
}

export function MegamenuEditor({
  open,
  onOpenChange,
  menuItemId,
  menuItemLabel,
  initialConfig,
  performers,
  products,
  videoCategories,
  pages,
  onSave,
}: MegamenuEditorProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [systemCollections, setSystemCollections] = React.useState<SystemCollection[]>([])

  // Fetch system collections when dialog opens
  React.useEffect(() => {
    if (open) {
      fetch("/api/system-collections")
        .then((res) => res.json())
        .then((data) => setSystemCollections(data))
        .catch(() => setSystemCollections([]))
    }
  }, [open])
  const [config, setConfig] = React.useState<MegamenuConfig>({
    featuredPerformerIds: initialConfig?.featuredPerformerIds || [],
    featuredProductIds: initialConfig?.featuredProductIds || [],
    videoSource: initialConfig?.videoSource || "MANUAL",
    videoIds: initialConfig?.videoIds || [],
    videoCategoryId: initialConfig?.videoCategoryId || null,
    links: initialConfig?.links || [],
    linksSectionTitle: initialConfig?.linksSectionTitle || "Descubre",
  })

  React.useEffect(() => {
    if (initialConfig) {
      setConfig({
        featuredPerformerIds: initialConfig.featuredPerformerIds || [],
        featuredProductIds: initialConfig.featuredProductIds || [],
        videoSource: initialConfig.videoSource || "MANUAL",
        videoIds: initialConfig.videoIds || [],
        videoCategoryId: initialConfig.videoCategoryId || null,
        links: initialConfig.links || [],
        linksSectionTitle: initialConfig.linksSectionTitle || "Descubre",
      })
    }
  }, [initialConfig])

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await onSave(config)
      toast.success("Megamenu guardado correctamente")
      onOpenChange(false)
    } catch {
      toast.error("Error al guardar el megamenu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePerformerChange = (ids: string[]) => {
    const limitedIds = ids.slice(0, 6)
    setConfig((prev) => ({ ...prev, featuredPerformerIds: limitedIds }))
  }

  const handleProductChange = (ids: string[]) => {
    const limitedIds = ids.slice(0, 6)
    setConfig((prev) => ({ ...prev, featuredProductIds: limitedIds }))
  }

  const handleVideoSourceChange = (source: VideoSourceType) => {
    setConfig((prev) => ({
      ...prev,
      videoSource: source,
      // Clear related fields when changing source
      videoIds: source === "MANUAL" ? prev.videoIds : [],
      videoCategoryId: source === "CATEGORY" ? prev.videoCategoryId : null,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle>Configurar Megamenu</DialogTitle>
          <DialogDescription>
            Configura el megamenu para "{menuItemLabel}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="performers" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="performers" className="flex items-center gap-2">
              <IconUsers className="size-4" />
              Modelos
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <IconShoppingBag className="size-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <IconVideo className="size-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <IconLink className="size-4" />
              Enlaces
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performers" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Featured Performers (max. 6)</Label>
              <p className="text-xs text-muted-foreground">
                Select up to 6 performers to show in the megamenu
              </p>
            </div>
            <PerformerSearch
              performers={performers}
              selectedIds={config.featuredPerformerIds}
              onChange={handlePerformerChange}
            />
            <p className="text-xs text-muted-foreground">
              {config.featuredPerformerIds.length}/6 selected
            </p>
          </TabsContent>

          <TabsContent value="products" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Featured Products (max. 6)</Label>
              <p className="text-xs text-muted-foreground">
                Select up to 6 products to show in the megamenu
              </p>
            </div>
            <ProductSearch
              products={products}
              selectedIds={config.featuredProductIds}
              onChange={handleProductChange}
            />
            <p className="text-xs text-muted-foreground">
              {config.featuredProductIds.length}/6 selected
            </p>
          </TabsContent>

          <TabsContent value="videos" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Fuente de videos</Label>
              <Select
                value={config.videoSource}
                onValueChange={(value) => handleVideoSourceChange(value as VideoSourceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Selección manual</SelectItem>
                  <SelectItem value="CATEGORY">Por categoría</SelectItem>
                  <SelectItem value="LATEST">Más recientes</SelectItem>
                  <SelectItem value="POPULAR">Más populares</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {config.videoSource === "MANUAL" && "Selecciona los videos específicos a mostrar"}
                {config.videoSource === "CATEGORY" && "Se mostrarán los 4 videos más recientes de la categoría"}
                {config.videoSource === "LATEST" && "Se mostrarán los 4 videos más recientes"}
                {config.videoSource === "POPULAR" && "Se mostrarán los 4 videos más populares"}
              </p>
            </div>

            {config.videoSource === "MANUAL" && (
              <div className="space-y-2">
                <Label>Videos seleccionados (máx. 4)</Label>
                <VideoSelector
                  value={config.videoIds.slice(0, 4)}
                  onChange={(ids) => setConfig((prev) => ({ ...prev, videoIds: ids.slice(0, 4) }))}
                  placeholder="Buscar videos..."
                />
                {config.videoIds.length >= 4 && (
                  <p className="text-xs text-amber-500">
                    Has alcanzado el máximo de 4 videos
                  </p>
                )}
              </div>
            )}

            {config.videoSource === "CATEGORY" && (
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={config.videoCategoryId || ""}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, videoCategoryId: value || null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="links" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linksSectionTitle">Título de la sección</Label>
              <Input
                id="linksSectionTitle"
                value={config.linksSectionTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, linksSectionTitle: e.target.value }))}
                placeholder="Descubre"
              />
              <p className="text-xs text-muted-foreground">
                Texto que aparecerá como título de la sección de enlaces
              </p>
            </div>
            <MegamenuLinksEditor
              links={config.links}
              onChange={(links) => setConfig((prev) => ({ ...prev, links }))}
              pages={pages}
              categories={videoCategories}
              systemCollections={systemCollections}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            <IconDeviceFloppy className="mr-2 size-4" />
            Guardar Megamenu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
