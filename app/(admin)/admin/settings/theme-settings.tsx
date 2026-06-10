"use client"

import * as React from "react"
import { IconLoader2, IconRefresh, IconPalette, IconTrash, IconDownload, IconInfoCircle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

// ─── Default Theme (must match ThemeStylesProvider defaults) ───

const defaultTheme = {
  global: {
    backgroundColor: "#000000",
    fontFamily: "Montserrat",
    brandColor: "#FA4860",
    brandColorHover: "#E03E54",
    accentColor: "#00B1DE",
    textPrimary: "#FFFFFF",
    textSecondary: "#E0E0E0",
    textMuted: "#999999",
    linkColor: "#FA4860",
    surfaceBg: "#1a1a1a",
    borderColor: "#262626",
    successColor: "#16A34A",
    errorColor: "#DC2626",
    warningColor: "#EAB308",
  },
  topBar: {
    backgroundColor: "#353535",
    textColor: "#FFFFFF",
    fontSize: "16",
    fontWeight: "700",
    height: "36",
    iconColor: "#FFFFFF",
  },
  header: {
    navTextColor: "#FFFFFF",
    navFontSize: "16",
    navFontWeight: "700",
    navHoverColor: "#FA4860",
    logoColor: "#FA4860",
    paddingY: "24",
  },
  sectionHeaders: {
    textColor: "#FFFFFF",
    fontSize: "16",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    lineColor: "#FFFFFF",
    lineHeight: "1",
    backgroundColor: "#000000",
  },
  videoCards: {
    titleColor: "#FFFFFF",
    titleFontSize: "18",
    titleFontWeight: "700",
    metaColor: "#999999",
    metaFontSize: "14",
    hoverAccentColor: "#FA4860",
    accessDeniedTextColor: "rgba(255,255,255,0.8)",
    accessDeniedAccentColor: "#FA4860",
  },
  performerCards: {
    nameColor: "#E0E0E0",
    nameFontSize: "20",
    nameFontWeight: "400",
    statsColor: "#B3B3B3",
    verifiedColor: "#00aaff",
  },
  ctaBanner: {
    titleColor: "#FFFFFF",
    titleFontSize: "32",
    descriptionColor: "#FFFFFF",
    descriptionFontSize: "18",
    overlayOpacity: "0.4",
  },
  countdown: {
    titleColor: "#FFFFFF",
    titleFontSize: "32",
    subtitleColor: "#FFFFFF",
    numberColor: "#FFFFFF",
    numberFontSize: "48",
    labelColor: "#CCCCCC",
    separatorColor: "#4D4D4D",
  },
  footer: {
    backgroundColor: "#000000",
    titleColor: "#FFFFFF",
    titleFontSize: "18",
    titleFontWeight: "700",
    linkColor: "#FFFFFF",
    linkHoverColor: "#D1D5DB",
    linkFontSize: "14",
    copyrightColor: "#FFFFFF",
    disclaimerLinkColor: "#FA4860",
    borderColor: "#1A1A1A",
    newsletterInputBg: "#262626",
    newsletterButtonBg: "#FA4860",
    socialIconColor: "#FFFFFF",
  },
  forms: {
    inputBg: "#000000",
    inputBorder: "#333333",
    inputText: "#FFFFFF",
    inputFocusBorder: "#FA4860",
    labelColor: "#9CA3AF",
  },
  cart: {
    itemNameColor: "#FFFFFF",
    itemMetaColor: "#999999",
    priceColor: "#FA4860",
    quantityBorderColor: "#333333",
    quantityButtonHoverBg: "#1A1A1A",
    summaryLabelColor: "#9CA3AF",
    removeButtonColor: "#9CA3AF",
    removeButtonHoverColor: "#DC2626",
    emptyIconColor: "#333333",
    emptyTextColor: "#9CA3AF",
    trustBadgeColor: "#9CA3AF",
  },
  comingSoon: {
    labelBg: "#2D3748",
    labelColor: "#FFFFFF",
    nameBg: "#2D3748",
    nameColor: "#FFFFFF",
    numberColor: "#FFFFFF",
    letterColor: "#9CA3AF",
    buttonBg: "#F4A0AB",
    buttonColor: "#FFFFFF",
  },
  carouselArrows: {
    backgroundColor: "#1A1A1A",
    iconColor: "#FFFFFF",
    borderColor: "#FA4860",
    borderWidth: "2",
    size: "44",
    borderRadius: "50",
    hoverBackgroundColor: "#000000",
  },
  variantSelector: {
    selectedBg: "#E03E54",
    selectedText: "#FFFFFF",
    defaultBg: "#f3f4f6",
    defaultText: "#000000",
  },
  buttons: {
    primary: {
      backgroundColor: "#FA4860",
      textColor: "#FFFFFF",
      borderRadius: "0",
      fontSize: "16",
      fontWeight: "500",
      padding: "10px 28px",
      hoverBackgroundColor: "#E03E54",
      hoverTextColor: "#FFFFFF",
    },
    secondary: {
      backgroundColor: "transparent",
      textColor: "#FA4860",
      borderRadius: "0",
      fontSize: "16",
      fontWeight: "500",
      padding: "10px 28px",
      borderColor: "#FA4860",
      borderWidth: "2",
      hoverBackgroundColor: "#FA4860",
      hoverTextColor: "#FFFFFF",
    },
  },
}

type ThemeSettings = typeof defaultTheme

interface ThemePreset {
  id: string
  name: string
  theme: ThemeSettings
  createdAt: string
}

// ─── Reusable Field Components ───

function ColorField({
  label,
  value,
  onChange,
  tooltip,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  tooltip?: string
}) {
  const isHex = /^#[0-9a-fA-F]{6}$/i.test(value)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <IconInfoCircle className="size-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isHex && (
          <div className="relative shrink-0">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div
              className="size-9 rounded-md ring-1 ring-black/10 cursor-pointer"
              style={{ backgroundColor: value }}
            />
          </div>
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm"
        />
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  unit = "px",
  min,
  max,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  unit?: string
  min?: number
  max?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label} ({unit})</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
      />
    </div>
  )
}

function WeightField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md border bg-background text-sm font-sans"
      >
        <option value="300">Light (300)</option>
        <option value="400">Normal (400)</option>
        <option value="500">Medium (500)</option>
        <option value="600">Semi-bold (600)</option>
        <option value="700">Bold (700)</option>
        <option value="800">Extra-bold (800)</option>
        <option value="900">Black (900)</option>
      </select>
    </div>
  )
}

function SectionResetButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="gap-1.5">
      <IconRefresh className="size-3.5" />
      Restablecer
    </Button>
  )
}

// ─── Main Component ───

export function ThemeSettings() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [theme, setTheme] = React.useState<ThemeSettings>(defaultTheme)
  const [hoveredButton, setHoveredButton] = React.useState<"primary" | "secondary" | null>(null)
  const [presets, setPresets] = React.useState<ThemePreset[]>([])
  const [isLoadingPresets, setIsLoadingPresets] = React.useState(true)
  const [savePresetOpen, setSavePresetOpen] = React.useState(false)
  const [presetName, setPresetName] = React.useState("")
  const [isSavingPreset, setIsSavingPreset] = React.useState(false)
  const [deletePresetId, setDeletePresetId] = React.useState<string | null>(null)

  React.useEffect(() => {
    loadSettings()
    loadPresets()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/design")
      if (response.ok) {
        const data = await response.json()
        if (data.theme) {
          setTheme(deepMerge(defaultTheme, data.theme))
        }
      }
    } catch (error) {
      console.error("Error loading theme:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPresets = async () => {
    try {
      const response = await fetch("/api/admin/settings/theme-presets")
      if (response.ok) {
        const data = await response.json()
        setPresets(data.presets || [])
      }
    } catch (error) {
      console.error("Error loading presets:", error)
    } finally {
      setIsLoadingPresets(false)
    }
  }

  const handleSavePreset = async () => {
    if (!presetName.trim()) return
    setIsSavingPreset(true)
    try {
      const response = await fetch("/api/admin/settings/theme-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: presetName.trim(), theme }),
      })
      if (!response.ok) throw new Error("Error al guardar")
      const data = await response.json()
      setPresets((prev) => [...prev, data.preset])
      setSavePresetOpen(false)
      setPresetName("")
      toast.success("Diseño guardado correctamente")
    } catch {
      toast.error("Error al guardar el diseño")
    } finally {
      setIsSavingPreset(false)
    }
  }

  const handleDeletePreset = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/settings/theme-presets?id=${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Error al eliminar")
      setPresets((prev) => prev.filter((p) => p.id !== id))
      setDeletePresetId(null)
      toast.success("Diseño eliminado")
    } catch {
      toast.error("Error al eliminar el diseño")
    }
  }

  const handleLoadPreset = (preset: ThemePreset) => {
    setTheme(deepMerge(defaultTheme, preset.theme as unknown as Record<string, unknown>))
    toast.success(`Diseño "${preset.name}" cargado. Pulsa "Guardar Tema" para aplicarlo.`)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      })
      if (!response.ok) throw new Error("Error al guardar")
      toast.success("Tema guardado correctamente")
    } catch {
      toast.error("Error al guardar el tema")
    } finally {
      setIsSaving(false)
    }
  }

  // Helper to update nested section
  function updateSection<K extends keyof ThemeSettings>(
    section: K,
    field: keyof ThemeSettings[K],
    value: string
  ) {
    setTheme((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }))
  }

  function resetSection<K extends keyof ThemeSettings>(section: K) {
    setTheme((prev) => ({
      ...prev,
      [section]: defaultTheme[section],
    }))
  }

  // Button styles helper for preview
  const getButtonStyle = (type: "primary" | "secondary", isHovered: boolean): React.CSSProperties => {
    const s = theme.buttons[type]
    const sec = theme.buttons.secondary
    return {
      backgroundColor: isHovered ? s.hoverBackgroundColor : s.backgroundColor,
      color: isHovered ? s.hoverTextColor : s.textColor,
      borderRadius: `${s.borderRadius}px`,
      fontSize: `${s.fontSize}px`,
      fontWeight: s.fontWeight,
      padding: s.padding,
      border: type === "secondary" ? `${sec.borderWidth}px solid ${sec.borderColor}` : "none",
      fontFamily: "Montserrat",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Diseño</CardTitle>
          <CardDescription>
            Personaliza toda la apariencia visual de la web: colores, tipografías, tamaños y estilos de cada zona.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="global" className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="presets">Mis Diseños</TabsTrigger>
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="topbar">Barra Superior</TabsTrigger>
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="sections">Cabeceras</TabsTrigger>
              <TabsTrigger value="videocards">Videos</TabsTrigger>
              <TabsTrigger value="performers">Actrices</TabsTrigger>
              <TabsTrigger value="comingSoon">Próximamente</TabsTrigger>
              <TabsTrigger value="cart">Tienda / Carrito</TabsTrigger>
              <TabsTrigger value="forms">Formularios</TabsTrigger>
              <TabsTrigger value="banners">Banners</TabsTrigger>
              <TabsTrigger value="footer">Footer</TabsTrigger>
              <TabsTrigger value="buttons">Botones</TabsTrigger>
            </TabsList>

            {/* ════════════════════════════════════════════
                MIS DISEÑOS - Presets guardados
               ════════════════════════════════════════════ */}
            <TabsContent value="presets" className="space-y-6">
              <div>
                <h3 className="font-semibold">Mis Diseños</h3>
                <p className="text-sm text-muted-foreground">
                  Guarda y gestiona diferentes configuraciones de diseño para tu web.
                </p>
              </div>

              {isLoadingPresets ? (
                <div className="flex items-center justify-center py-12">
                  <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : presets.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <IconPalette className="size-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No tienes diseños guardados. Personaliza tu tema y pulsa &quot;Guardar como Diseño&quot; para crear tu primer preset.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <IconPalette className="size-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{preset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Creado el{" "}
                            {new Date(preset.createdAt).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleLoadPreset(preset)}
                          className="gap-1.5 bg-zinc-800 text-white hover:bg-zinc-700"
                        >
                          <IconDownload className="size-3.5" />
                          Cargar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setDeletePresetId(preset.id)}
                          className="gap-1.5 bg-red-600 text-white hover:bg-red-700"
                        >
                          <IconTrash className="size-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ════════════════════════════════════════════
                GLOBAL - Colores base de todo el sitio
               ════════════════════════════════════════════ */}
            <TabsContent value="global" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Configuracion Global</h3>
                  <p className="text-sm text-muted-foreground">Colores base, tipografia y superficies. Estos valores se heredan en toda la web.</p>
                </div>
                <SectionResetButton onClick={() => resetSection("global")} />
              </div>

              {/* Preview */}
              <div className="p-6 rounded-lg border" style={{ backgroundColor: theme.global.backgroundColor }}>
                <p style={{ color: theme.global.textPrimary, fontFamily: theme.global.fontFamily, fontSize: "18px", fontWeight: 700 }}>
                  Texto Principal
                </p>
                <p style={{ color: theme.global.textSecondary, fontFamily: theme.global.fontFamily, fontSize: "14px" }}>
                  Texto Secundario
                </p>
                <p style={{ color: theme.global.textMuted, fontFamily: theme.global.fontFamily, fontSize: "12px" }}>
                  Texto Atenuado
                </p>
                <div className="flex gap-3 mt-3">
                  <div className="size-8 rounded" style={{ backgroundColor: theme.global.brandColor }} title="Marca" />
                  <div className="size-8 rounded" style={{ backgroundColor: theme.global.accentColor }} title="Acento" />
                  <div className="size-8 rounded" style={{ backgroundColor: theme.global.surfaceBg, border: "1px solid gray" }} title="Superficie" />
                  <div className="size-8 rounded" style={{ backgroundColor: theme.global.successColor }} title="Exito" />
                  <div className="size-8 rounded" style={{ backgroundColor: theme.global.errorColor }} title="Error" />
                  <div className="size-8 rounded" style={{ backgroundColor: theme.global.warningColor }} title="Aviso" />
                </div>
              </div>

              <Separator />

              <h4 className="font-medium text-sm">Colores y Tipografia</h4>
              <p className="text-xs text-muted-foreground -mt-4">Fondo de pagina, colores de texto, color de marca y fuente principal.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Fondo de Pagina" tooltip="Color de fondo de toda la web. Todas las paginas heredan este color." value={theme.global.backgroundColor} onChange={(v) => updateSection("global", "backgroundColor", v)} />
                <ColorField label="Color de Marca" tooltip="Color principal: botones primarios, enlaces destacados, precios, badges activos." value={theme.global.brandColor} onChange={(v) => updateSection("global", "brandColor", v)} />
                <ColorField label="Marca Hover" tooltip="Variante oscura del color de marca al pasar el raton sobre botones primarios." value={theme.global.brandColorHover} onChange={(v) => updateSection("global", "brandColorHover", v)} />
                <ColorField label="Color Acento" tooltip="Color secundario: botones filtrar/ordenar, links Editar en checkout, Continuar Comprando." value={theme.global.accentColor} onChange={(v) => updateSection("global", "accentColor", v)} />
                <ColorField label="Texto Principal" tooltip="Titulos, precios grandes, nombres de producto, totales." value={theme.global.textPrimary} onChange={(v) => updateSection("global", "textPrimary", v)} />
                <ColorField label="Texto Secundario" tooltip="Descripciones, subtitulos, texto de segundo nivel." value={theme.global.textSecondary} onChange={(v) => updateSection("global", "textSecondary", v)} />
                <ColorField label="Texto Atenuado" tooltip="Fechas, contadores de vistas, resultados, placeholders." value={theme.global.textMuted} onChange={(v) => updateSection("global", "textMuted", v)} />
                <ColorField label="Color de Enlaces" tooltip="Color de enlaces en texto corrido (no botones)." value={theme.global.linkColor} onChange={(v) => updateSection("global", "linkColor", v)} />
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Fuente Principal</Label>
                  <Input value={theme.global.fontFamily} onChange={(e) => updateSection("global", "fontFamily", e.target.value)} />
                </div>
              </div>

              <Separator />

              <h4 className="font-medium text-sm">Superficies y Estados</h4>
              <p className="text-xs text-muted-foreground -mt-4">Fondo de paneles/cards, bordes y colores semanticos para estados (stock, errores, avisos).</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Fondo Superficie" tooltip="Fondo de paneles: Direccion de Envio, Resumen del Pedido, items del carrito." value={theme.global.surfaceBg} onChange={(v) => updateSection("global", "surfaceBg", v)} />
                <ColorField label="Exito" tooltip="En stock, descuentos, envio gratis, codigo promo aplicado." value={theme.global.successColor} onChange={(v) => updateSection("global", "successColor", v)} />
                <ColorField label="Error" tooltip="Agotado, no disponible, hover del boton eliminar producto." value={theme.global.errorColor} onChange={(v) => updateSection("global", "errorColor", v)} />
                <ColorField label="Aviso" tooltip="Solo quedan X unidades, alerta de pago por transferencia pendiente." value={theme.global.warningColor} onChange={(v) => updateSection("global", "warningColor", v)} />
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                BARRA SUPERIOR - Franja encima del header
               ════════════════════════════════════════════ */}
            <TabsContent value="topbar" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Barra Superior</h3>
                  <p className="text-sm text-muted-foreground">Franja fina encima del header con enlaces de acceso rapido (Mi Cuenta, Mis Listas, etc.).</p>
                </div>
                <SectionResetButton onClick={() => resetSection("topBar")} />
              </div>

              {/* Preview */}
              <div
                className="rounded-lg flex items-center justify-end px-6 gap-6"
                style={{
                  backgroundColor: theme.topBar.backgroundColor,
                  height: `${theme.topBar.height}px`,
                }}
              >
                <span style={{
                  color: theme.topBar.textColor,
                  fontSize: `${theme.topBar.fontSize}px`,
                  fontWeight: theme.topBar.fontWeight,
                  fontFamily: "Montserrat",
                }}>
                  Ejemplo Link
                </span>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Color de Fondo" value={theme.topBar.backgroundColor} onChange={(v) => updateSection("topBar", "backgroundColor", v)} />
                <ColorField label="Color de Texto" value={theme.topBar.textColor} onChange={(v) => updateSection("topBar", "textColor", v)} />
                <ColorField label="Color de Iconos" value={theme.topBar.iconColor} onChange={(v) => updateSection("topBar", "iconColor", v)} />
                <NumberField label="Tamano de Fuente" value={theme.topBar.fontSize} onChange={(v) => updateSection("topBar", "fontSize", v)} min={10} max={24} />
                <WeightField label="Grosor de Fuente" value={theme.topBar.fontWeight} onChange={(v) => updateSection("topBar", "fontWeight", v)} />
                <NumberField label="Altura de la Barra" value={theme.topBar.height} onChange={(v) => updateSection("topBar", "height", v)} min={24} max={60} />
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                HEADER - Logo y navegacion principal
               ════════════════════════════════════════════ */}
            <TabsContent value="header" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Header y Navegacion</h3>
                  <p className="text-sm text-muted-foreground">Logo, menu de navegacion principal y megamenu. Visible en todas las paginas.</p>
                </div>
                <SectionResetButton onClick={() => resetSection("header")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Color de los Enlaces del Menu" value={theme.header.navTextColor} onChange={(v) => updateSection("header", "navTextColor", v)} />
                <ColorField label="Color Hover de los Enlaces" value={theme.header.navHoverColor} onChange={(v) => updateSection("header", "navHoverColor", v)} />
                <ColorField label="Color del Logo (si es texto)" value={theme.header.logoColor} onChange={(v) => updateSection("header", "logoColor", v)} />
                <NumberField label="Tamano Fuente Menu" value={theme.header.navFontSize} onChange={(v) => updateSection("header", "navFontSize", v)} min={10} max={24} />
                <WeightField label="Grosor Fuente Menu" value={theme.header.navFontWeight} onChange={(v) => updateSection("header", "navFontWeight", v)} />
                <NumberField label="Alto de la Barra (padding vertical, px)" value={theme.header.paddingY ?? "24"} onChange={(v) => updateSection("header", "paddingY", v)} min={4} max={48} />
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                CABECERAS DE SECCION - Titulos con linea
               ════════════════════════════════════════════ */}
            <TabsContent value="sections" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Cabeceras de Seccion</h3>
                  <p className="text-sm text-muted-foreground">Titulos con linea decorativa que separan secciones en la home y listados (ej: &quot;ULTIMOS VIDEOS ANADIDOS&quot;).</p>
                </div>
                <SectionResetButton onClick={() => resetSection("sectionHeaders")} />
              </div>

              {/* Preview */}
              <div className="rounded-lg overflow-hidden">
                <div className="w-full py-2" style={{ backgroundColor: theme.sectionHeaders.backgroundColor }}>
                  <div className="flex items-center gap-4 px-4">
                    <div className="flex-1" style={{ height: `${theme.sectionHeaders.lineHeight}px`, backgroundColor: theme.sectionHeaders.lineColor }} />
                    <span style={{
                      color: theme.sectionHeaders.textColor,
                      fontSize: `${theme.sectionHeaders.fontSize}px`,
                      fontWeight: theme.sectionHeaders.fontWeight,
                      fontFamily: "Montserrat",
                      textTransform: theme.sectionHeaders.textTransform as React.CSSProperties["textTransform"],
                      letterSpacing: theme.sectionHeaders.letterSpacing,
                    }}>
                      ULTIMOS VIDEOS ANADIDOS
                    </span>
                    <div className="flex-1" style={{ height: `${theme.sectionHeaders.lineHeight}px`, backgroundColor: theme.sectionHeaders.lineColor }} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Color del Titulo" value={theme.sectionHeaders.textColor} onChange={(v) => updateSection("sectionHeaders", "textColor", v)} />
                <ColorField label="Color de la Linea Decorativa" value={theme.sectionHeaders.lineColor} onChange={(v) => updateSection("sectionHeaders", "lineColor", v)} />
                <ColorField label="Color de Fondo" value={theme.sectionHeaders.backgroundColor} onChange={(v) => updateSection("sectionHeaders", "backgroundColor", v)} />
                <NumberField label="Tamano del Titulo" value={theme.sectionHeaders.fontSize} onChange={(v) => updateSection("sectionHeaders", "fontSize", v)} min={10} max={32} />
                <WeightField label="Grosor del Titulo" value={theme.sectionHeaders.fontWeight} onChange={(v) => updateSection("sectionHeaders", "fontWeight", v)} />
                <NumberField label="Grosor de la Linea" value={theme.sectionHeaders.lineHeight} onChange={(v) => updateSection("sectionHeaders", "lineHeight", v)} min={1} max={5} />
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Transformacion de Texto</Label>
                  <select
                    value={theme.sectionHeaders.textTransform}
                    onChange={(e) => updateSection("sectionHeaders", "textTransform", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm font-sans"
                  >
                    <option value="uppercase">MAYUSCULAS</option>
                    <option value="capitalize">Capitalizar</option>
                    <option value="lowercase">minusculas</option>
                    <option value="none">Normal</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Espaciado entre Letras</Label>
                  <Input value={theme.sectionHeaders.letterSpacing} onChange={(e) => updateSection("sectionHeaders", "letterSpacing", e.target.value)} placeholder="0.05em" />
                </div>
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                VIDEOS - /videos y /videos/[slug]
               ════════════════════════════════════════════ */}
            <TabsContent value="videocards" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Videos</h3>
                  <p className="text-sm text-muted-foreground">Tarjetas de video en el listado /videos y en la ficha /videos/[slug]. Controla titulo, meta (vistas, fecha) y hover.</p>
                </div>
                <SectionResetButton onClick={() => resetSection("videoCards")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Titulo del Video" value={theme.videoCards.titleColor} onChange={(v) => updateSection("videoCards", "titleColor", v)} />
                <NumberField label="Tamano del Titulo" value={theme.videoCards.titleFontSize} onChange={(v) => updateSection("videoCards", "titleFontSize", v)} min={12} max={28} />
                <WeightField label="Grosor del Titulo" value={theme.videoCards.titleFontWeight} onChange={(v) => updateSection("videoCards", "titleFontWeight", v)} />
                <ColorField label="Meta (vistas, fecha, duracion)" value={theme.videoCards.metaColor} onChange={(v) => updateSection("videoCards", "metaColor", v)} />
                <NumberField label="Tamano de la Meta" value={theme.videoCards.metaFontSize} onChange={(v) => updateSection("videoCards", "metaFontSize", v)} min={10} max={20} />
                <ColorField label="Color Hover en Nombres de Actrices" value={theme.videoCards.hoverAccentColor} onChange={(v) => updateSection("videoCards", "hoverAccentColor", v)} />
              </div>

              <Separator className="my-6" />

              <div>
                <h4 className="font-semibold">Acceso Denegado</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Colores del texto &quot;Requiere suscripción X o superior&quot; en el overlay de vídeos bloqueados.
                  El resto del aviso (título, mensajes según el motivo, botón) se edita en
                  <strong> Settings → Video Access</strong>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorField
                    label="Color del texto"
                    tooltip="Color del párrafo 'Requiere suscripción ... o superior'. Acepta HEX. Si quieres transparencia, edítalo en Video Access con un rgba(...)."
                    value={theme.videoCards.accessDeniedTextColor}
                    onChange={(v) => updateSection("videoCards", "accessDeniedTextColor", v)}
                  />
                  <ColorField
                    label="Color del nombre del plan"
                    tooltip="Color de la palabra del plan (p. ej. 'Free') dentro del aviso."
                    value={theme.videoCards.accessDeniedAccentColor}
                    onChange={(v) => updateSection("videoCards", "accessDeniedAccentColor", v)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                ACTRICES - /modelos y /modelos/[slug]
               ════════════════════════════════════════════ */}
            <TabsContent value="performers" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Actrices</h3>
                  <p className="text-sm text-muted-foreground">Tarjetas de actrices en el listado /modelos y en el perfil /modelos/[slug]. Nombre, estadisticas y badge verificado.</p>
                </div>
                <SectionResetButton onClick={() => resetSection("performerCards")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Nombre de la Actriz" value={theme.performerCards.nameColor} onChange={(v) => updateSection("performerCards", "nameColor", v)} />
                <NumberField label="Tamano del Nombre" value={theme.performerCards.nameFontSize} onChange={(v) => updateSection("performerCards", "nameFontSize", v)} min={12} max={32} />
                <WeightField label="Grosor del Nombre" value={theme.performerCards.nameFontWeight} onChange={(v) => updateSection("performerCards", "nameFontWeight", v)} />
                <ColorField label="Estadisticas (num. videos)" value={theme.performerCards.statsColor} onChange={(v) => updateSection("performerCards", "statsColor", v)} />
                <ColorField label="Badge Verificado" value={theme.performerCards.verifiedColor} onChange={(v) => updateSection("performerCards", "verifiedColor", v)} />
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                PRÓXIMAMENTE - Coming Soon overlay on performer cards
               ════════════════════════════════════════════ */}
            <TabsContent value="comingSoon" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Próximamente</h3>
                  <p className="text-sm text-muted-foreground">Colores del overlay &quot;Coming Soon&quot; que aparece en las tarjetas de actrices cuando se activa &quot;Próximamente&quot; en su perfil.</p>
                </div>
                <SectionResetButton onClick={() => resetSection("comingSoon")} />
              </div>

              {/* Preview */}
              <div className="flex justify-center">
                <div className="relative w-[220px] h-[320px] rounded-md overflow-hidden bg-gray-800">
                  <div className="absolute inset-0 bg-black/60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-3">
                    <div className="px-3 py-1 rounded-sm mb-2 text-[10px] font-bold tracking-widest uppercase" style={{ backgroundColor: theme.comingSoon.labelBg, color: theme.comingSoon.labelColor }}>
                      NEW PERFORMER
                    </div>
                    <div className="px-3 py-1 rounded-sm mb-4 text-sm font-bold" style={{ backgroundColor: theme.comingSoon.nameBg, color: theme.comingSoon.nameColor }}>
                      Performer Name
                    </div>
                    <div className="flex gap-3 mb-4">
                      {["12", "08", "34", "56"].map((v, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <span className="text-xl font-bold" style={{ color: theme.comingSoon.numberColor }}>{v}</span>
                          <span className="text-[10px]" style={{ color: theme.comingSoon.letterColor }}>{["D", "H", "M", "S"][i]}</span>
                        </div>
                      ))}
                    </div>
                    <button className="px-4 py-1.5 rounded-sm text-xs font-bold uppercase" style={{ backgroundColor: theme.comingSoon.buttonBg, color: theme.comingSoon.buttonColor }}>
                      Notify Me
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Fondo Etiqueta" value={theme.comingSoon.labelBg} onChange={(v) => updateSection("comingSoon", "labelBg", v)} tooltip="Fondo del texto NEW PERFORMER" />
                <ColorField label="Texto Etiqueta" value={theme.comingSoon.labelColor} onChange={(v) => updateSection("comingSoon", "labelColor", v)} />
                <ColorField label="Fondo Nombre" value={theme.comingSoon.nameBg} onChange={(v) => updateSection("comingSoon", "nameBg", v)} tooltip="Fondo del nombre de la actriz" />
                <ColorField label="Texto Nombre" value={theme.comingSoon.nameColor} onChange={(v) => updateSection("comingSoon", "nameColor", v)} />
                <ColorField label="Numeros Cuenta Atras" value={theme.comingSoon.numberColor} onChange={(v) => updateSection("comingSoon", "numberColor", v)} />
                <ColorField label="Letras D H M S" value={theme.comingSoon.letterColor} onChange={(v) => updateSection("comingSoon", "letterColor", v)} />
                <ColorField label="Fondo Boton" value={theme.comingSoon.buttonBg} onChange={(v) => updateSection("comingSoon", "buttonBg", v)} tooltip="Fondo del boton Notify Me" />
                <ColorField label="Texto Boton" value={theme.comingSoon.buttonColor} onChange={(v) => updateSection("comingSoon", "buttonColor", v)} />
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                TIENDA / CARRITO - Dropdown, /carrito, /checkout
               ════════════════════════════════════════════ */}
            <TabsContent value="cart" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Tienda y Carrito</h3>
                  <p className="text-sm text-muted-foreground">Dropdown del carrito en el header, pagina /carrito y pagina /checkout. Productos, precios, cantidades y resumen del pedido.</p>
                </div>
                <SectionResetButton onClick={() => resetSection("cart")} />
              </div>

              <h4 className="font-medium text-sm">General</h4>
              <p className="text-xs text-muted-foreground -mt-4">Fondo y bordes de paneles, cards y secciones en carrito y checkout (Direccion de Envio, Resumen del Pedido, etc.).</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Fondo de Paneles (Direccion, Resumen...)" value={theme.global.surfaceBg} onChange={(v) => updateSection("global", "surfaceBg", v)} />
                <ColorField label="Bordes y Separadores" value={theme.global.borderColor} onChange={(v) => updateSection("global", "borderColor", v)} />
              </div>

              <Separator />

              <h4 className="font-medium text-sm">Productos en el Carrito</h4>
              <p className="text-xs text-muted-foreground -mt-4">Colores del nombre, variante, precio y controles de cantidad de cada producto.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Nombre del Producto" value={theme.cart.itemNameColor} onChange={(v) => updateSection("cart", "itemNameColor", v)} />
                <ColorField label="Info Secundaria (variante, cantidad)" value={theme.cart.itemMetaColor} onChange={(v) => updateSection("cart", "itemMetaColor", v)} />
                <ColorField label="Precio del Producto" value={theme.cart.priceColor} onChange={(v) => updateSection("cart", "priceColor", v)} />
                <ColorField label="Borde del Selector de Cantidad" value={theme.cart.quantityBorderColor} onChange={(v) => updateSection("cart", "quantityBorderColor", v)} />
                <ColorField label="Hover Botones +/- Cantidad" value={theme.cart.quantityButtonHoverBg} onChange={(v) => updateSection("cart", "quantityButtonHoverBg", v)} />
              </div>

              <Separator />

              <h4 className="font-medium text-sm">Resumen y Acciones</h4>
              <p className="text-xs text-muted-foreground -mt-4">Labels del resumen (Subtotal, Envio, Total), boton eliminar y badges de confianza.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Labels del Resumen (Subtotal, Envio)" value={theme.cart.summaryLabelColor} onChange={(v) => updateSection("cart", "summaryLabelColor", v)} />
                <ColorField label="Boton Eliminar Producto" value={theme.cart.removeButtonColor} onChange={(v) => updateSection("cart", "removeButtonColor", v)} />
                <ColorField label="Eliminar Hover" value={theme.cart.removeButtonHoverColor} onChange={(v) => updateSection("cart", "removeButtonHoverColor", v)} />
                <ColorField label="Icono Carrito Vacio" value={theme.cart.emptyIconColor} onChange={(v) => updateSection("cart", "emptyIconColor", v)} />
                <ColorField label="Texto Carrito Vacio" value={theme.cart.emptyTextColor} onChange={(v) => updateSection("cart", "emptyTextColor", v)} />
                <ColorField label="Badges de Confianza (SSL, envio)" value={theme.cart.trustBadgeColor} onChange={(v) => updateSection("cart", "trustBadgeColor", v)} />
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                FORMULARIOS - Inputs en checkout, contacto
               ════════════════════════════════════════════ */}
            <TabsContent value="forms" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Formularios</h3>
                  <p className="text-sm text-muted-foreground">Campos de texto, selects y labels en el checkout, registro y cualquier formulario de la web.</p>
                </div>
                <SectionResetButton onClick={() => resetSection("forms")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Fondo del Campo" value={theme.forms.inputBg} onChange={(v) => updateSection("forms", "inputBg", v)} />
                <ColorField label="Borde del Campo" value={theme.forms.inputBorder} onChange={(v) => updateSection("forms", "inputBorder", v)} />
                <ColorField label="Texto dentro del Campo" value={theme.forms.inputText} onChange={(v) => updateSection("forms", "inputText", v)} />
                <ColorField label="Borde al hacer Focus" value={theme.forms.inputFocusBorder} onChange={(v) => updateSection("forms", "inputFocusBorder", v)} />
                <ColorField label="Color de las Etiquetas (labels)" value={theme.forms.labelColor} onChange={(v) => updateSection("forms", "labelColor", v)} />
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                BANNERS - CTA Banner y Countdown
               ════════════════════════════════════════════ */}
            <TabsContent value="banners" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Banners Promocionales</h3>
                  <p className="text-sm text-muted-foreground">Banners de llamada a la accion (CTA) y cuenta atras que aparecen en la home y otras paginas.</p>
                </div>
              </div>

              {/* CTA Sub-section */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Banner CTA (Llamada a la Accion)</h4>
                    <p className="text-xs text-muted-foreground">Banner con imagen de fondo, titulo y descripcion. Se usa para destacar contenido o suscripciones.</p>
                  </div>
                  <SectionResetButton onClick={() => resetSection("ctaBanner")} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ColorField label="Color del Titulo" value={theme.ctaBanner.titleColor} onChange={(v) => updateSection("ctaBanner", "titleColor", v)} />
                  <NumberField label="Tamano del Titulo" value={theme.ctaBanner.titleFontSize} onChange={(v) => updateSection("ctaBanner", "titleFontSize", v)} min={16} max={64} />
                  <ColorField label="Color de la Descripcion" value={theme.ctaBanner.descriptionColor} onChange={(v) => updateSection("ctaBanner", "descriptionColor", v)} />
                  <NumberField label="Tamano de la Descripcion" value={theme.ctaBanner.descriptionFontSize} onChange={(v) => updateSection("ctaBanner", "descriptionFontSize", v)} min={12} max={32} />
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Opacidad del Overlay</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={theme.ctaBanner.overlayOpacity}
                      onChange={(e) => updateSection("ctaBanner", "overlayOpacity", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">0 = transparente, 1 = opaco</p>
                  </div>
                </div>
              </div>

              {/* Countdown Sub-section */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Cuenta Atras (Countdown)</h4>
                    <p className="text-xs text-muted-foreground">Temporizador con titulo, numeros y etiquetas (dias, horas, minutos). Se usa para promociones con fecha limite.</p>
                  </div>
                  <SectionResetButton onClick={() => resetSection("countdown")} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ColorField label="Color del Titulo" value={theme.countdown.titleColor} onChange={(v) => updateSection("countdown", "titleColor", v)} />
                  <NumberField label="Tamano del Titulo" value={theme.countdown.titleFontSize} onChange={(v) => updateSection("countdown", "titleFontSize", v)} min={16} max={64} />
                  <ColorField label="Color del Subtitulo" value={theme.countdown.subtitleColor} onChange={(v) => updateSection("countdown", "subtitleColor", v)} />
                  <ColorField label="Color de los Numeros" value={theme.countdown.numberColor} onChange={(v) => updateSection("countdown", "numberColor", v)} />
                  <NumberField label="Tamano de los Numeros" value={theme.countdown.numberFontSize} onChange={(v) => updateSection("countdown", "numberFontSize", v)} min={24} max={96} />
                  <ColorField label="Color de Etiquetas (Dias, Horas...)" value={theme.countdown.labelColor} onChange={(v) => updateSection("countdown", "labelColor", v)} />
                  <ColorField label="Color del Separador" value={theme.countdown.separatorColor} onChange={(v) => updateSection("countdown", "separatorColor", v)} />
                </div>
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                FOOTER - Pie de pagina
               ════════════════════════════════════════════ */}
            <TabsContent value="footer" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Footer</h3>
                  <p className="text-sm text-muted-foreground">Pie de pagina con columnas de enlaces, newsletter, redes sociales y copyright.</p>
                </div>
                <SectionResetButton onClick={() => resetSection("footer")} />
              </div>

              <h4 className="font-medium text-sm">Fondo y Titulos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Color de Fondo" value={theme.footer.backgroundColor} onChange={(v) => updateSection("footer", "backgroundColor", v)} />
                <ColorField label="Color de los Titulos de Columna" value={theme.footer.titleColor} onChange={(v) => updateSection("footer", "titleColor", v)} />
                <NumberField label="Tamano de los Titulos" value={theme.footer.titleFontSize} onChange={(v) => updateSection("footer", "titleFontSize", v)} min={12} max={28} />
                <WeightField label="Grosor de los Titulos" value={theme.footer.titleFontWeight} onChange={(v) => updateSection("footer", "titleFontWeight", v)} />
              </div>

              <Separator />

              <h4 className="font-medium text-sm">Enlaces y Textos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Color de los Enlaces" value={theme.footer.linkColor} onChange={(v) => updateSection("footer", "linkColor", v)} />
                <ColorField label="Color Hover de los Enlaces" value={theme.footer.linkHoverColor} onChange={(v) => updateSection("footer", "linkHoverColor", v)} />
                <NumberField label="Tamano de los Enlaces" value={theme.footer.linkFontSize} onChange={(v) => updateSection("footer", "linkFontSize", v)} min={10} max={20} />
                <ColorField label="Color del Copyright" value={theme.footer.copyrightColor} onChange={(v) => updateSection("footer", "copyrightColor", v)} />
                <ColorField label="Color de Links Legales (disclaimer)" value={theme.footer.disclaimerLinkColor} onChange={(v) => updateSection("footer", "disclaimerLinkColor", v)} />
                <ColorField label="Color de los Bordes/Separadores" value={theme.footer.borderColor} onChange={(v) => updateSection("footer", "borderColor", v)} />
              </div>

              <Separator />

              <h4 className="font-medium text-sm">Newsletter y Redes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ColorField label="Fondo del Input de Newsletter" value={theme.footer.newsletterInputBg} onChange={(v) => updateSection("footer", "newsletterInputBg", v)} />
                <ColorField label="Fondo del Boton de Newsletter" value={theme.footer.newsletterButtonBg} onChange={(v) => updateSection("footer", "newsletterButtonBg", v)} />
                <ColorField label="Color de los Iconos Sociales" value={theme.footer.socialIconColor} onChange={(v) => updateSection("footer", "socialIconColor", v)} />
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════
                BOTONES - Primario y secundario globales
               ════════════════════════════════════════════ */}
            <TabsContent value="buttons" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Botones Globales</h3>
                  <p className="text-sm text-muted-foreground">Estilo de los botones primario y secundario usados en toda la web (Anadir al carrito, Finalizar compra, Ver carrito, etc.).</p>
                </div>
                <SectionResetButton onClick={() => resetSection("buttons")} />
              </div>

              <Tabs defaultValue="primary" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="primary">Primario (Anadir al carrito, Comprar...)</TabsTrigger>
                  <TabsTrigger value="secondary">Secundario (Ver carrito, Volver...)</TabsTrigger>
                  <TabsTrigger value="carouselArrows">Flechas Carrusel</TabsTrigger>
                  <TabsTrigger value="variantSelector">Selector Variantes</TabsTrigger>
                </TabsList>

                <TabsContent value="primary" className="space-y-6">
                  {/* Preview */}
                  <div className="p-6 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-400 mb-4">Vista previa (hover para ver estado hover)</p>
                    <button
                      style={getButtonStyle("primary", hoveredButton === "primary")}
                      onMouseEnter={() => setHoveredButton("primary")}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      Boton primario
                    </button>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Estado Normal</h4>
                      <ColorField label="Color de Fondo" value={theme.buttons.primary.backgroundColor} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, primary: { ...p.buttons.primary, backgroundColor: v } } }))} />
                      <ColorField label="Color de Texto" value={theme.buttons.primary.textColor} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, primary: { ...p.buttons.primary, textColor: v } } }))} />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Estado Hover</h4>
                      <ColorField label="Fondo Hover" value={theme.buttons.primary.hoverBackgroundColor} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, primary: { ...p.buttons.primary, hoverBackgroundColor: v } } }))} />
                      <ColorField label="Texto Hover" value={theme.buttons.primary.hoverTextColor} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, primary: { ...p.buttons.primary, hoverTextColor: v } } }))} />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumberField label="Redondeo de Esquinas" value={theme.buttons.primary.borderRadius} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, primary: { ...p.buttons.primary, borderRadius: v } } }))} min={0} />
                    <NumberField label="Tamano de Fuente" value={theme.buttons.primary.fontSize} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, primary: { ...p.buttons.primary, fontSize: v } } }))} min={10} max={24} />
                    <WeightField label="Grosor de Fuente" value={theme.buttons.primary.fontWeight} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, primary: { ...p.buttons.primary, fontWeight: v } } }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Padding (CSS)</Label>
                    <Input
                      value={theme.buttons.primary.padding}
                      onChange={(e) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, primary: { ...p.buttons.primary, padding: e.target.value } } }))}
                      placeholder="10px 28px"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="secondary" className="space-y-6">
                  {/* Preview */}
                  <div className="p-6 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-400 mb-4">Vista previa (hover para ver estado hover)</p>
                    <button
                      style={getButtonStyle("secondary", hoveredButton === "secondary")}
                      onMouseEnter={() => setHoveredButton("secondary")}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      Boton secundario
                    </button>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Estado Normal</h4>
                      <ColorField label="Color de Fondo" value={theme.buttons.secondary.backgroundColor} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, secondary: { ...p.buttons.secondary, backgroundColor: v } } }))} />
                      <ColorField label="Color de Texto" value={theme.buttons.secondary.textColor} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, secondary: { ...p.buttons.secondary, textColor: v } } }))} />
                      <ColorField label="Color del Borde" value={theme.buttons.secondary.borderColor || "#FA4860"} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, secondary: { ...p.buttons.secondary, borderColor: v } } }))} />
                      <NumberField label="Grosor del Borde" value={theme.buttons.secondary.borderWidth || "2"} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, secondary: { ...p.buttons.secondary, borderWidth: v } } }))} min={0} max={5} />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Estado Hover</h4>
                      <ColorField label="Fondo Hover" value={theme.buttons.secondary.hoverBackgroundColor} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, secondary: { ...p.buttons.secondary, hoverBackgroundColor: v } } }))} />
                      <ColorField label="Texto Hover" value={theme.buttons.secondary.hoverTextColor} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, secondary: { ...p.buttons.secondary, hoverTextColor: v } } }))} />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumberField label="Redondeo de Esquinas" value={theme.buttons.secondary.borderRadius} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, secondary: { ...p.buttons.secondary, borderRadius: v } } }))} min={0} />
                    <NumberField label="Tamano de Fuente" value={theme.buttons.secondary.fontSize} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, secondary: { ...p.buttons.secondary, fontSize: v } } }))} min={10} max={24} />
                    <WeightField label="Grosor de Fuente" value={theme.buttons.secondary.fontWeight} onChange={(v) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, secondary: { ...p.buttons.secondary, fontWeight: v } } }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Padding (CSS)</Label>
                    <Input
                      value={theme.buttons.secondary.padding}
                      onChange={(e) => setTheme((p) => ({ ...p, buttons: { ...p.buttons, secondary: { ...p.buttons.secondary, padding: e.target.value } } }))}
                      placeholder="10px 28px"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="carouselArrows" className="space-y-6">
                  {/* Preview */}
                  <div className="p-6 bg-gray-900 rounded-lg flex items-center justify-center gap-8">
                    <p className="text-sm text-gray-400">Vista previa:</p>
                    <button
                      style={{
                        width: `${theme.carouselArrows.size}px`,
                        height: `${theme.carouselArrows.size}px`,
                        backgroundColor: theme.carouselArrows.backgroundColor,
                        borderColor: theme.carouselArrows.borderColor,
                        borderWidth: `${theme.carouselArrows.borderWidth}px`,
                        borderStyle: "solid",
                        borderRadius: `${theme.carouselArrows.borderRadius}%`,
                        color: theme.carouselArrows.iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      style={{
                        width: `${theme.carouselArrows.size}px`,
                        height: `${theme.carouselArrows.size}px`,
                        backgroundColor: theme.carouselArrows.backgroundColor,
                        borderColor: theme.carouselArrows.borderColor,
                        borderWidth: `${theme.carouselArrows.borderWidth}px`,
                        borderStyle: "solid",
                        borderRadius: `${theme.carouselArrows.borderRadius}%`,
                        color: theme.carouselArrows.iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Colores</h4>
                      <ColorField label="Color de Fondo" value={theme.carouselArrows.backgroundColor} onChange={(v) => setTheme((p) => ({ ...p, carouselArrows: { ...p.carouselArrows, backgroundColor: v } }))} tooltip="Color de fondo de las flechas" />
                      <ColorField label="Color del Icono" value={theme.carouselArrows.iconColor} onChange={(v) => setTheme((p) => ({ ...p, carouselArrows: { ...p.carouselArrows, iconColor: v } }))} />
                      <ColorField label="Color del Borde" value={theme.carouselArrows.borderColor} onChange={(v) => setTheme((p) => ({ ...p, carouselArrows: { ...p.carouselArrows, borderColor: v } }))} />
                      <ColorField label="Fondo Hover" value={theme.carouselArrows.hoverBackgroundColor} onChange={(v) => setTheme((p) => ({ ...p, carouselArrows: { ...p.carouselArrows, hoverBackgroundColor: v } }))} tooltip="Color de fondo al pasar el raton" />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Dimensiones</h4>
                      <NumberField label="Tamano (px)" value={theme.carouselArrows.size} onChange={(v) => setTheme((p) => ({ ...p, carouselArrows: { ...p.carouselArrows, size: v } }))} min={24} max={80} />
                      <NumberField label="Grosor del Borde (px)" value={theme.carouselArrows.borderWidth} onChange={(v) => setTheme((p) => ({ ...p, carouselArrows: { ...p.carouselArrows, borderWidth: v } }))} min={0} max={6} />
                      <NumberField label="Redondeo (%)" value={theme.carouselArrows.borderRadius} onChange={(v) => setTheme((p) => ({ ...p, carouselArrows: { ...p.carouselArrows, borderRadius: v } }))} min={0} max={50} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="variantSelector" className="space-y-6">
                  {/* Preview */}
                  <div className="p-6 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-400 mb-4">Vista previa (botones de talla en /tienda)</p>
                    <div className="flex flex-wrap gap-2">
                      {["S", "M", "L", "XL"].map((size, i) => (
                        <span
                          key={size}
                          className="px-6 py-3 rounded-xl text-sm font-semibold"
                          style={i === 1 ? {
                            backgroundColor: theme.variantSelector.selectedBg,
                            color: theme.variantSelector.selectedText,
                          } : {
                            backgroundColor: theme.variantSelector.defaultBg,
                            color: theme.variantSelector.defaultText,
                          }}
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Estado Seleccionado</h4>
                      <ColorField label="Color de Fondo" value={theme.variantSelector.selectedBg} onChange={(v) => setTheme((p) => ({ ...p, variantSelector: { ...p.variantSelector, selectedBg: v } }))} />
                      <ColorField label="Color de Texto" value={theme.variantSelector.selectedText} onChange={(v) => setTheme((p) => ({ ...p, variantSelector: { ...p.variantSelector, selectedText: v } }))} />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Estado Normal</h4>
                      <ColorField label="Color de Fondo" value={theme.variantSelector.defaultBg} onChange={(v) => setTheme((p) => ({ ...p, variantSelector: { ...p.variantSelector, defaultBg: v } }))} />
                      <ColorField label="Color de Texto" value={theme.variantSelector.defaultText} onChange={(v) => setTheme((p) => ({ ...p, variantSelector: { ...p.variantSelector, defaultText: v } }))} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button size="lg" onClick={() => setSavePresetOpen(true)} className="gap-2 bg-zinc-800 text-white hover:bg-zinc-700">
          <IconPalette className="size-4" />
          Guardar como Diseño
        </Button>
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="bg-zinc-900 text-white hover:bg-zinc-800">
          {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          Guardar Tema
        </Button>
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
        <DialogContent className="bg-white text-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Guardar como Diseño</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Guarda la configuracion actual como un diseño reutilizable. Podras cargarlo en cualquier momento desde la pestaña &quot;Mis Diseños&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="preset-name" className="text-zinc-700">Nombre del diseño</Label>
            <Input
              id="preset-name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Ej: Oscuro Rojo, Minimalista Claro..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && presetName.trim()) handleSavePreset()
              }}
              autoFocus
              className="border-zinc-300 text-zinc-900 placeholder:text-zinc-400"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavePresetOpen(false)} className="border-zinc-300 text-zinc-700 hover:bg-zinc-100">
              Cancelar
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim() || isSavingPreset} className="bg-zinc-900 text-white hover:bg-zinc-800">
              {isSavingPreset && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Preset Confirmation */}
      <AlertDialog open={!!deletePresetId} onOpenChange={(open) => !open && setDeletePresetId(null)}>
        <AlertDialogContent className="bg-white text-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900">Eliminar diseño</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              Este diseño se eliminara permanentemente. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-300 text-zinc-700 hover:bg-zinc-100">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePresetId && handleDeletePreset(deletePresetId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  )
}

// ─── Utility ───

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result = { ...target } as Record<string, unknown>
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      result[key] &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>)
    } else {
      result[key] = source[key]
    }
  }
  return result as T
}
