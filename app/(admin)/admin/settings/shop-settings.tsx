"use client"

import * as React from "react"
import { IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type {
  ShopSettings as ShopSettingsData,
  ShopSettingsFaqItem,
  ShopSettingsTrustBadge,
  ShopSettingsCareInstruction,
  SectionStyles,
} from "@/lib/get-shop-settings"

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-border"
        />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#hex o vacio para default"
        className="w-40 text-xs"
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      {value && (
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange("")}>
          <IconTrash className="size-3 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}

function StylesEditor({ styles, basePath, onChange, fields }: {
  styles: SectionStyles
  basePath: string
  onChange: (path: string, value: unknown) => void
  fields: Array<{ key: keyof SectionStyles; label: string }>
}) {
  return (
    <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
      <span className="text-xs font-medium text-muted-foreground">Estilos personalizados (vacio = color por defecto)</span>
      {fields.map(({ key, label }) => (
        <ColorInput
          key={key}
          label={label}
          value={(styles[key] as string) || ""}
          onChange={(v) => onChange(`${basePath}.${key}`, v)}
        />
      ))}
    </div>
  )
}

const AVAILABLE_ICONS = [
  "Package", "Shield", "Lock", "RotateCcw", "Truck", "ShieldCheck",
  "Heart", "Star", "Award", "CheckCircle", "Clock", "Gift",
  "CreditCard", "Eye", "EyeOff", "Headphones", "ThumbsUp", "Zap",
]

export function ProductSettings() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [settings, setSettings] = React.useState<ShopSettingsData | null>(null)

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/shop")
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error("Error loading product settings:", error)
      toast.error("Error al cargar la configuracion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Configuracion guardada")
      } else {
        toast.error("Error al guardar")
      }
    } catch (error) {
      console.error("Error saving product settings:", error)
      toast.error("Error al guardar la configuracion")
    } finally {
      setIsSaving(false)
    }
  }

  const updateSettings = (path: string, value: unknown) => {
    if (!settings) return
    setSettings(prev => {
      if (!prev) return prev
      const keys = path.split(".")
      const newSettings = JSON.parse(JSON.stringify(prev))
      let current = newSettings as Record<string, unknown>
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as Record<string, unknown>
      }
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Product Detail Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Ficha de Producto</CardTitle>
          <CardDescription>
            Configuracion de elementos que aparecen en la pagina de detalle del producto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trust Badges */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Badges de Confianza</Label>
            <p className="text-sm text-muted-foreground">Iconos con garantias que aparecen debajo del boton de compra</p>
            {settings.productDetail.trustBadges.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <Select
                  value={item.icon}
                  onValueChange={(value) => {
                    const newItems = [...settings.productDetail.trustBadges]
                    newItems[index] = { ...newItems[index], icon: value }
                    updateSettings("productDetail.trustBadges", newItems)
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={item.label}
                  onChange={(e) => {
                    const newItems = [...settings.productDetail.trustBadges]
                    newItems[index] = { ...newItems[index], label: e.target.value }
                    updateSettings("productDetail.trustBadges", newItems)
                  }}
                  placeholder="Etiqueta"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newItems = settings.productDetail.trustBadges.filter((_, i) => i !== index)
                    updateSettings("productDetail.trustBadges", newItems)
                  }}
                >
                  <IconTrash className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newItems: ShopSettingsTrustBadge[] = [
                  ...settings.productDetail.trustBadges,
                  { icon: "Shield", label: "" },
                ]
                updateSettings("productDetail.trustBadges", newItems)
              }}
            >
              <IconPlus className="size-4 mr-2" />
              Agregar badge
            </Button>
            <StylesEditor
              styles={settings.productDetail.trustBadgesStyles || { bgColor: "", titleColor: "" }}
              basePath="productDetail.trustBadgesStyles"
              onChange={updateSettings}
              fields={[
                { key: "bgColor", label: "Fondo seccion" },
                { key: "iconColor", label: "Color icono" },
                { key: "iconBgColor", label: "Fondo icono" },
              ]}
            />
          </div>

          <hr />

          {/* Care Instructions */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Instrucciones de Cuidado</Label>
            <p className="text-sm text-muted-foreground">Tarjetas de cuidado que aparecen en la seccion de descripcion</p>
            {settings.productDetail.careInstructions.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Instruccion {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newItems = settings.productDetail.careInstructions.filter((_, i) => i !== index)
                      updateSettings("productDetail.careInstructions", newItems)
                    }}
                  >
                    <IconTrash className="size-4 text-destructive" />
                  </Button>
                </div>
                <Input
                  value={item.title}
                  onChange={(e) => {
                    const newItems = [...settings.productDetail.careInstructions]
                    newItems[index] = { ...newItems[index], title: e.target.value }
                    updateSettings("productDetail.careInstructions", newItems)
                  }}
                  placeholder="Titulo (ej: Limpieza)"
                />
                <Textarea
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...settings.productDetail.careInstructions]
                    newItems[index] = { ...newItems[index], description: e.target.value }
                    updateSettings("productDetail.careInstructions", newItems)
                  }}
                  placeholder="Descripcion"
                  rows={2}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newItems: ShopSettingsCareInstruction[] = [
                  ...settings.productDetail.careInstructions,
                  { title: "", description: "" },
                ]
                updateSettings("productDetail.careInstructions", newItems)
              }}
            >
              <IconPlus className="size-4 mr-2" />
              Agregar instruccion
            </Button>
            <StylesEditor
              styles={settings.productDetail.careInstructionsStyles || { bgColor: "", titleColor: "" }}
              basePath="productDetail.careInstructionsStyles"
              onChange={updateSettings}
              fields={[
                { key: "bgColor", label: "Fondo seccion" },
                { key: "titleColor", label: "Color titulo" },
                { key: "cardBgColor", label: "Fondo tarjetas" },
                { key: "textColor", label: "Color texto" },
              ]}
            />
          </div>

          <hr />

          {/* Product FAQ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">FAQ del Producto</Label>
                <p className="text-sm text-muted-foreground">Preguntas frecuentes en la ficha de producto</p>
              </div>
              <Switch
                checked={settings.productDetail.faq.enabled}
                onCheckedChange={(checked) => updateSettings("productDetail.faq.enabled", checked)}
              />
            </div>
            {settings.productDetail.faq.enabled && (
              <>
                {settings.productDetail.faq.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pregunta {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newItems = settings.productDetail.faq.items.filter((_, i) => i !== index)
                          updateSettings("productDetail.faq.items", newItems)
                        }}
                      >
                        <IconTrash className="size-4 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      value={item.question}
                      onChange={(e) => {
                        const newItems = [...settings.productDetail.faq.items]
                        newItems[index] = { ...newItems[index], question: e.target.value }
                        updateSettings("productDetail.faq.items", newItems)
                      }}
                      placeholder="Pregunta"
                    />
                    <Textarea
                      value={item.answer}
                      onChange={(e) => {
                        const newItems = [...settings.productDetail.faq.items]
                        newItems[index] = { ...newItems[index], answer: e.target.value }
                        updateSettings("productDetail.faq.items", newItems)
                      }}
                      placeholder="Respuesta"
                      rows={2}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItems: ShopSettingsFaqItem[] = [
                      ...settings.productDetail.faq.items,
                      { question: "", answer: "" },
                    ]
                    updateSettings("productDetail.faq.items", newItems)
                  }}
                >
                  <IconPlus className="size-4 mr-2" />
                  Agregar pregunta
                </Button>
                <StylesEditor
                  styles={settings.productDetail.faq.styles || { bgColor: "", titleColor: "" }}
                  basePath="productDetail.faq.styles"
                  onChange={updateSettings}
                  fields={[
                    { key: "bgColor", label: "Fondo seccion" },
                    { key: "titleColor", label: "Color titulo" },
                  ]}
                />
              </>
            )}
          </div>

          <hr />

          {/* Related Products Styles */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tambien te puede gustar</Label>
            <p className="text-sm text-muted-foreground">Estilos de la seccion de productos relacionados</p>
            <StylesEditor
              styles={settings.productDetail.relatedProductsStyles || { bgColor: "", titleColor: "" }}
              basePath="productDetail.relatedProductsStyles"
              onChange={updateSettings}
              fields={[
                { key: "bgColor", label: "Fondo seccion" },
                { key: "titleColor", label: "Color titulo" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
