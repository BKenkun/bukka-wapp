"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconLoader2,
  IconDeviceFloppy,
  IconExternalLink,
  IconLink,
  IconChevronUp,
  IconChevronDown,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandYoutube,
  IconBrandTiktok,
  IconBrandTelegram,
  IconBrandDiscord,
  IconMail,
  IconPhone,
  IconHome,
  IconVideo,
  IconUsers,
  IconShoppingBag,
  IconMessage,
  IconHeart,
  IconStar,
  IconCrown,
  IconSettings,
  IconHelp,
  IconFileText,
  IconShield,
  IconLock,
  IconInfoCircle,
  IconQuestionMark,
  IconLayoutGrid,
  IconUserPlus,
  IconUser,
  IconThumbUp,
  IconUpload,
  IconWorld,
  IconMapPin,
  IconRss,
  IconLogin,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { MegamenuEditor } from "@/components/admin/megamenu-editor"
import type { MegamenuLink } from "@/types/megamenu"
import type { VideoSourceType, Prisma } from "@prisma/client"

// Iconos disponibles para los menús
const AVAILABLE_ICONS = [
  { name: "IconHome", label: "Inicio", icon: IconHome },
  { name: "IconVideo", label: "Vídeos", icon: IconVideo },
  { name: "IconUsers", label: "Usuarios", icon: IconUsers },
  { name: "IconShoppingBag", label: "Tienda", icon: IconShoppingBag },
  { name: "IconMessage", label: "Mensaje", icon: IconMessage },
  { name: "IconHeart", label: "Corazón", icon: IconHeart },
  { name: "IconStar", label: "Estrella", icon: IconStar },
  { name: "IconCrown", label: "Corona", icon: IconCrown },
  { name: "IconSettings", label: "Configuración", icon: IconSettings },
  { name: "IconHelp", label: "Ayuda", icon: IconHelp },
  { name: "IconFileText", label: "Documento", icon: IconFileText },
  { name: "IconShield", label: "Escudo", icon: IconShield },
  { name: "IconLock", label: "Candado", icon: IconLock },
  { name: "IconInfoCircle", label: "Info", icon: IconInfoCircle },
  { name: "IconQuestionMark", label: "Pregunta", icon: IconQuestionMark },
  { name: "IconMail", label: "Email", icon: IconMail },
  { name: "IconPhone", label: "Teléfono", icon: IconPhone },
  { name: "IconExternalLink", label: "Enlace externo", icon: IconExternalLink },
  // Usuarios y autenticación
  { name: "IconUserPlus", label: "Registrarse", icon: IconUserPlus },
  { name: "IconUser", label: "Usuario", icon: IconUser },
  { name: "IconLogin", label: "Iniciar sesión", icon: IconLogin },
  { name: "IconThumbUp", label: "Me gusta", icon: IconThumbUp },
  { name: "IconUpload", label: "Subir", icon: IconUpload },
  { name: "IconWorld", label: "Idioma", icon: IconWorld },
  { name: "IconMapPin", label: "Ubicación", icon: IconMapPin },
  { name: "IconRss", label: "RSS/Feed", icon: IconRss },
  // Redes sociales
  { name: "IconBrandTwitter", label: "Twitter/X", icon: IconBrandTwitter },
  { name: "IconBrandInstagram", label: "Instagram", icon: IconBrandInstagram },
  { name: "IconBrandFacebook", label: "Facebook", icon: IconBrandFacebook },
  { name: "IconBrandYoutube", label: "YouTube", icon: IconBrandYoutube },
  { name: "IconBrandTiktok", label: "TikTok", icon: IconBrandTiktok },
  { name: "IconBrandTelegram", label: "Telegram", icon: IconBrandTelegram },
  { name: "IconBrandDiscord", label: "Discord", icon: IconBrandDiscord },
]

interface MegamenuConfigInput {
  id?: string
  featuredPerformerIds: string[]
  featuredProductIds: string[]
  videoSource: VideoSourceType
  videoIds: string[]
  videoCategoryId: string | null
  links: MegamenuLink[]
  linksSectionTitle: string
}

interface MegamenuConfigFromDB {
  id: string
  featuredPerformerIds: string[]
  featuredProductIds: string[]
  videoSource: VideoSourceType
  videoIds: string[]
  videoCategoryId: string | null
  links: Prisma.JsonValue
  linksSectionTitle: string
}

interface MenuItem {
  id?: string
  label: string
  url: string | null
  pageId: string | null
  icon: string | null
  customIcon: string | null
  order: number
  openInNewTab: boolean
  isVisible: boolean
  highlight: boolean
  highlightColor: string | null
  minTierLevel: number | null
  hasMegamenu: boolean
  megamenuConfig?: MegamenuConfigInput | null
}

interface Menu {
  id: string
  name: string
  slug: string
  title: string | null
  items: MenuItem[]
}

interface Page {
  id: string
  title: string
  slug: string
}

interface SubscriptionPlan {
  id: string
  name: string
  level: number
  slug: string
}

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
  images: string[]
}

interface VideoCategory {
  id: string
  name: string
  slug: string
}

interface MenuEditorProps {
  menuSlug: string
  menuName: string
  defaultTitle?: string
  existingMenu: Menu | null
  pages: Page[]
  subscriptionPlans: SubscriptionPlan[]
  performers: Performer[]
  products: Product[]
  videoCategories: VideoCategory[]
}

export function MenuEditor({ menuSlug, menuName, defaultTitle, existingMenu, pages, subscriptionPlans, performers, products, videoCategories }: MenuEditorProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [items, setItems] = React.useState<MenuItem[]>(
    existingMenu?.items?.map(item => ({
      ...item,
      hasMegamenu: item.hasMegamenu || false,
    })) || []
  )
  const [menuTitle, setMenuTitle] = React.useState(
    existingMenu?.title || defaultTitle || ""
  )
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null)
  const [megamenuEditorItem, setMegamenuEditorItem] = React.useState<MenuItem | null>(null)

  // Form state for new/edit item
  const [formData, setFormData] = React.useState<MenuItem>({
    label: "",
    url: "",
    pageId: null,
    icon: null,
    customIcon: null,
    order: 0,
    openInNewTab: false,
    isVisible: true,
    highlight: false,
    highlightColor: null,
    minTierLevel: 0,
    hasMegamenu: false,
  })

  const resetForm = () => {
    setFormData({
      label: "",
      url: "",
      pageId: null,
      icon: null,
      customIcon: null,
      order: items.length,
      openInNewTab: false,
      isVisible: true,
      highlight: false,
      highlightColor: null,
      minTierLevel: 0,
      hasMegamenu: false,
    })
    setEditingItem(null)
  }

  const handleAddItem = () => {
    if (!formData.label) {
      toast.error("El texto del enlace es requerido")
      return
    }

    if (!formData.url && !formData.pageId) {
      toast.error("Debes especificar una URL o seleccionar una página")
      return
    }

    if (editingItem) {
      // Update existing item
      setItems((prev) =>
        prev.map((item) =>
          item === editingItem ? { ...formData, id: editingItem.id } : item
        )
      )
    } else {
      // Add new item
      setItems((prev) => [...prev, { ...formData, order: prev.length }])
    }

    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setFormData(item)
    setIsAddDialogOpen(true)
  }

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items]
    const newIndex = direction === "up" ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= items.length) return

    const temp = newItems[index]
    newItems[index] = newItems[newIndex]
    newItems[newIndex] = temp

    // Update order
    newItems.forEach((item, i) => {
      item.order = i
    })

    setItems(newItems)
  }

  const handleSave = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/menus/${menuSlug}`, {
        method: existingMenu ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: menuName,
          title: menuTitle || null,
          items: items.map((item, index) => ({
            ...item,
            order: index,
            url: item.pageId ? null : item.url,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar")
      }

      toast.success("Menú guardado correctamente")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getIconComponent = (iconName: string | null, customIcon: string | null = null) => {
    if (iconName === "custom" && customIcon) {
      return (
        <span
          className="size-4 [&>svg]:size-4"
          dangerouslySetInnerHTML={{ __html: customIcon }}
        />
      )
    }
    if (!iconName || iconName === "custom") return null
    const iconDef = AVAILABLE_ICONS.find((i) => i.name === iconName)
    if (!iconDef) return null
    const IconComponent = iconDef.icon
    return <IconComponent className="size-4" />
  }

  // Mostrar campo de título solo para menús de footer
  const showTitleField = menuSlug.startsWith("footer-col-")

  return (
    <div className="space-y-6">
      {/* Título del Footer (solo para columnas de footer) */}
      {showTitleField && (
        <Card>
          <CardHeader>
            <CardTitle>Título de la Columna</CardTitle>
            <CardDescription>
              Este título aparecerá como encabezado de la columna en el footer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="menuTitle">Título</Label>
              <Input
                id="menuTitle"
                value={menuTitle}
                onChange={(e) => setMenuTitle(e.target.value)}
                placeholder="Ej: SERVICIOS, CONTACTO, INFORMACIÓN..."
              />
              <p className="text-xs text-muted-foreground">
                Deja vacío para usar el título por defecto
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Elementos del Menú</CardTitle>
              <CardDescription>
                Arrastra para reordenar o usa los botones de flecha
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <IconPlus className="mr-2 size-4" />
                  Añadir enlace
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] text-foreground">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Editar enlace" : "Añadir enlace"}
                  </DialogTitle>
                  <DialogDescription>
                    Configura el enlace del menú
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Texto del enlace *</Label>
                    <Input
                      id="label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="Inicio"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de enlace</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={formData.pageId ? "outline" : "secondary"}
                        className="justify-start"
                        onClick={() => setFormData({ ...formData, pageId: null })}
                      >
                        <IconLink className="mr-2 size-4" />
                        URL personalizada
                      </Button>
                      <Button
                        type="button"
                        variant={formData.pageId ? "secondary" : "outline"}
                        className="justify-start"
                        onClick={() => setFormData({ ...formData, url: null, pageId: pages[0]?.id || null })}
                      >
                        <IconFileText className="mr-2 size-4" />
                        Página interna
                      </Button>
                    </div>
                  </div>

                  {!formData.pageId ? (
                    <div className="space-y-2">
                      <Label htmlFor="url">URL *</Label>
                      <Input
                        id="url"
                        value={formData.url || ""}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://... o /ruta-interna"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Página</Label>
                      <Select
                        value={formData.pageId || ""}
                        onValueChange={(value) => setFormData({ ...formData, pageId: value })}
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

                  <div className="space-y-2">
                    <Label>Icono (opcional)</Label>
                    <Select
                      value={formData.icon || "none"}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        icon: value === "none" ? null : value,
                        customIcon: value === "custom" ? formData.customIcon : null
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin icono" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="none">Sin icono</SelectItem>
                        {AVAILABLE_ICONS.map((iconDef) => {
                          const IconComp = iconDef.icon
                          return (
                            <SelectItem key={iconDef.name} value={iconDef.name}>
                              <div className="flex items-center gap-2">
                                <IconComp className="size-4" />
                                {iconDef.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <IconFileText className="size-4" />
                            Otro (SVG personalizado)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.icon === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="customIcon">Código SVG</Label>
                      <textarea
                        id="customIcon"
                        value={formData.customIcon || ""}
                        onChange={(e) => setFormData({ ...formData, customIcon: e.target.value })}
                        placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>'
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Pega el código SVG completo. El icono se ajustará a 16x16px.
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
                      checked={formData.openInNewTab}
                      onCheckedChange={(checked) => setFormData({ ...formData, openInNewTab: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="highlight">Destacar enlace</Label>
                      <p className="text-xs text-muted-foreground">
                        Añade un color de fondo para resaltar
                      </p>
                    </div>
                    <Switch
                      id="highlight"
                      checked={formData.highlight}
                      onCheckedChange={(checked) => setFormData({ ...formData, highlight: checked })}
                    />
                  </div>

                  {formData.highlight && (
                    <div className="space-y-2">
                      <Label htmlFor="highlightColor">Color de destacado</Label>
                      <Input
                        id="highlightColor"
                        type="color"
                        value={formData.highlightColor || "#FA4860"}
                        onChange={(e) => setFormData({ ...formData, highlightColor: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Suscripción mínima requerida</Label>
                    <Select
                      value={formData.minTierLevel?.toString() || "0"}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        minTierLevel: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona nivel mínimo" />
                      </SelectTrigger>
                      <SelectContent>
                        {subscriptionPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.level.toString()}>
                            {plan.name} {plan.level === 0 ? "(Visible para todos)" : `(Nivel ${plan.level}+)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Solo los usuarios con este nivel de suscripción o superior verán este enlace
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isVisible">Visible</Label>
                      <p className="text-xs text-muted-foreground">
                        Desactiva para ocultar sin eliminar
                      </p>
                    </div>
                    <Switch
                      id="isVisible"
                      checked={formData.isVisible}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                    />
                  </div>

                  {/* Megamenu toggle - only for header-main menu */}
                  {menuSlug === "header-main" && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <Label htmlFor="hasMegamenu">Activar Megamenu</Label>
                        <p className="text-xs text-muted-foreground">
                          Muestra un megamenu con modelos, videos y enlaces al pasar el cursor
                        </p>
                      </div>
                      <Switch
                        id="hasMegamenu"
                        checked={formData.hasMegamenu}
                        onCheckedChange={(checked) => setFormData({ ...formData, hasMegamenu: checked })}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false)
                    resetForm()
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddItem}>
                    {editingItem ? "Guardar cambios" : "Añadir enlace"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconLink className="size-12 mx-auto mb-4 opacity-20" />
              <p>No hay enlaces en este menú</p>
              <p className="text-sm">Haz clic en "Añadir enlace" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 border rounded-lg bg-card ${!item.isVisible ? "opacity-50" : ""}`}
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0}
                    >
                      <IconChevronUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => moveItem(index, "down")}
                      disabled={index === items.length - 1}
                    >
                      <IconChevronDown className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {(item.icon || item.customIcon) && (
                      <div className="size-8 rounded bg-muted flex items-center justify-center shrink-0">
                        {getIconComponent(item.icon, item.customIcon)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{item.label}</p>
                        {item.highlight && (
                          <Badge
                            style={{ backgroundColor: item.highlightColor || "#FA4860" }}
                            className="text-white text-xs"
                          >
                            Destacado
                          </Badge>
                        )}
                        {item.hasMegamenu && (
                          <Badge variant="default" className="text-xs bg-purple-600">
                            Megamenu
                          </Badge>
                        )}
                        {item.minTierLevel !== null && item.minTierLevel !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {subscriptionPlans.find(p => p.level === item.minTierLevel)?.name || `Nivel ${item.minTierLevel}`}+
                          </Badge>
                        )}
                        {!item.isVisible && (
                          <Badge variant="secondary" className="text-xs">
                            Oculto
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.pageId
                          ? `Página: ${pages.find((p) => p.id === item.pageId)?.title || "Desconocida"}`
                          : item.url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.openInNewTab && (
                      <IconExternalLink className="size-4 text-muted-foreground" />
                    )}
                    {item.hasMegamenu && item.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMegamenuEditorItem(item)}
                      >
                        <IconLayoutGrid className="mr-1 size-3" />
                        Megamenu
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteItem(index)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSubmitting} size="lg">
          {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          <IconDeviceFloppy className="mr-2 size-4" />
          Guardar Menú
        </Button>
      </div>

      {/* Megamenu Editor Dialog */}
      {megamenuEditorItem && megamenuEditorItem.id && (
        <MegamenuEditor
          open={!!megamenuEditorItem}
          onOpenChange={(open) => !open && setMegamenuEditorItem(null)}
          menuItemId={megamenuEditorItem.id}
          menuItemLabel={megamenuEditorItem.label}
          initialConfig={megamenuEditorItem.megamenuConfig || null}
          performers={performers}
          products={products}
          videoCategories={videoCategories}
          pages={pages}
          onSave={async (config) => {
            const response = await fetch(`/api/admin/megamenu/${megamenuEditorItem.id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(config),
            })
            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || "Error al guardar")
            }
            // Update local state
            setItems((prev) =>
              prev.map((item) =>
                item.id === megamenuEditorItem.id
                  ? { ...item, megamenuConfig: config }
                  : item
              )
            )
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
