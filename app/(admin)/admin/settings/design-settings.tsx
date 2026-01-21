"use client"

import * as React from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface ButtonSettings {
  backgroundColor: string
  textColor: string
  borderRadius: string
  fontSize: string
  fontWeight: string
  padding: string
  hoverBackgroundColor: string
  hoverTextColor: string
  borderColor?: string
  borderWidth?: string
}

interface DesignSettings {
  primary: ButtonSettings
  secondary: ButtonSettings
}

const defaultSettings: DesignSettings = {
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
}

export function DesignSettings() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [settings, setSettings] = React.useState<DesignSettings>(defaultSettings)
  const [hoveredButton, setHoveredButton] = React.useState<"primary" | "secondary" | null>(null)

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/design")
      if (response.ok) {
        const data = await response.json()
        if (data.buttons) {
          setSettings({
            primary: { ...defaultSettings.primary, ...data.buttons.primary },
            secondary: { ...defaultSettings.secondary, ...data.buttons.secondary },
          })
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buttons: settings }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar")
      }

      toast.success("Configuración de diseño guardada")
    } catch (error) {
      toast.error("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const updatePrimary = (key: keyof ButtonSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      primary: { ...prev.primary, [key]: value },
    }))
  }

  const updateSecondary = (key: keyof ButtonSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      secondary: { ...prev.secondary, [key]: value },
    }))
  }

  const getButtonStyle = (type: "primary" | "secondary", isHovered: boolean): React.CSSProperties => {
    const s = settings[type]
    return {
      backgroundColor: isHovered ? s.hoverBackgroundColor : s.backgroundColor,
      color: isHovered ? s.hoverTextColor : s.textColor,
      borderRadius: `${s.borderRadius}px`,
      fontSize: `${s.fontSize}px`,
      fontWeight: s.fontWeight,
      padding: s.padding,
      border: type === "secondary" ? `${s.borderWidth}px solid ${s.borderColor}` : "none",
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diseño de Botones</CardTitle>
          <CardDescription>
            Personaliza la apariencia de los botones en toda la web
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="primary" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="primary">Botón Primario</TabsTrigger>
              <TabsTrigger value="secondary">Botón Secundario</TabsTrigger>
            </TabsList>

            <TabsContent value="primary" className="space-y-6">
              {/* Preview */}
              <div className="p-6 bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-400 mb-4">Vista previa (pasa el cursor para ver hover)</p>
                <button
                  style={getButtonStyle("primary", hoveredButton === "primary")}
                  onMouseEnter={() => setHoveredButton("primary")}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  Botón primario
                </button>
              </div>

              <Separator />

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Estado Normal</h4>

                  <div className="space-y-2">
                    <Label>Color de Fondo</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primary.backgroundColor}
                        onChange={(e) => updatePrimary("backgroundColor", e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.primary.backgroundColor}
                        onChange={(e) => updatePrimary("backgroundColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Color de Texto</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primary.textColor}
                        onChange={(e) => updatePrimary("textColor", e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.primary.textColor}
                        onChange={(e) => updatePrimary("textColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Estado Hover</h4>

                  <div className="space-y-2">
                    <Label>Color de Fondo (Hover)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primary.hoverBackgroundColor}
                        onChange={(e) => updatePrimary("hoverBackgroundColor", e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.primary.hoverBackgroundColor}
                        onChange={(e) => updatePrimary("hoverBackgroundColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Color de Texto (Hover)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primary.hoverTextColor}
                        onChange={(e) => updatePrimary("hoverTextColor", e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.primary.hoverTextColor}
                        onChange={(e) => updatePrimary("hoverTextColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Redondeo (px)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.primary.borderRadius}
                    onChange={(e) => updatePrimary("borderRadius", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tamaño de Fuente (px)</Label>
                  <Input
                    type="number"
                    min="10"
                    max="24"
                    value={settings.primary.fontSize}
                    onChange={(e) => updatePrimary("fontSize", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grosor de Fuente</Label>
                  <select
                    value={settings.primary.fontWeight}
                    onChange={(e) => updatePrimary("fontWeight", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semi-bold (600)</option>
                    <option value="700">Bold (700)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Padding (CSS)</Label>
                <Input
                  value={settings.primary.padding}
                  onChange={(e) => updatePrimary("padding", e.target.value)}
                  placeholder="10px 28px"
                />
                <p className="text-xs text-muted-foreground">
                  Formato: vertical horizontal (ej: 10px 28px)
                </p>
              </div>
            </TabsContent>

            <TabsContent value="secondary" className="space-y-6">
              {/* Preview */}
              <div className="p-6 bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-400 mb-4">Vista previa (pasa el cursor para ver hover)</p>
                <button
                  style={getButtonStyle("secondary", hoveredButton === "secondary")}
                  onMouseEnter={() => setHoveredButton("secondary")}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  Botón secundario
                </button>
              </div>

              <Separator />

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Estado Normal</h4>

                  <div className="space-y-2">
                    <Label>Color de Fondo</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.secondary.backgroundColor === "transparent" ? "#000000" : settings.secondary.backgroundColor}
                        onChange={(e) => updateSecondary("backgroundColor", e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.secondary.backgroundColor}
                        onChange={(e) => updateSecondary("backgroundColor", e.target.value)}
                        placeholder="transparent o #color"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Color de Texto</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.secondary.textColor}
                        onChange={(e) => updateSecondary("textColor", e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.secondary.textColor}
                        onChange={(e) => updateSecondary("textColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Color de Borde</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.secondary.borderColor || "#FA4860"}
                        onChange={(e) => updateSecondary("borderColor", e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.secondary.borderColor}
                        onChange={(e) => updateSecondary("borderColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Grosor de Borde (px)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={settings.secondary.borderWidth}
                      onChange={(e) => updateSecondary("borderWidth", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Estado Hover</h4>

                  <div className="space-y-2">
                    <Label>Color de Fondo (Hover)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.secondary.hoverBackgroundColor}
                        onChange={(e) => updateSecondary("hoverBackgroundColor", e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.secondary.hoverBackgroundColor}
                        onChange={(e) => updateSecondary("hoverBackgroundColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Color de Texto (Hover)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.secondary.hoverTextColor}
                        onChange={(e) => updateSecondary("hoverTextColor", e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={settings.secondary.hoverTextColor}
                        onChange={(e) => updateSecondary("hoverTextColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Redondeo (px)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.secondary.borderRadius}
                    onChange={(e) => updateSecondary("borderRadius", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tamaño de Fuente (px)</Label>
                  <Input
                    type="number"
                    min="10"
                    max="24"
                    value={settings.secondary.fontSize}
                    onChange={(e) => updateSecondary("fontSize", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grosor de Fuente</Label>
                  <select
                    value={settings.secondary.fontWeight}
                    onChange={(e) => updateSecondary("fontWeight", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semi-bold (600)</option>
                    <option value="700">Bold (700)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Padding (CSS)</Label>
                <Input
                  value={settings.secondary.padding}
                  onChange={(e) => updateSecondary("padding", e.target.value)}
                  placeholder="10px 28px"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          Guardar Configuración de Diseño
        </Button>
      </div>
    </div>
  )
}
