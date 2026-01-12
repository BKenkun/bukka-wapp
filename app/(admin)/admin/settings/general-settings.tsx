"use client"

import * as React from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export function GeneralSettings() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Site Settings
  const [siteName, setSiteName] = React.useState("BUKKAKERY")
  const [siteDescription, setSiteDescription] = React.useState("")
  const [supportEmail, setSupportEmail] = React.useState("")
  const [maintenanceMode, setMaintenanceMode] = React.useState(false)

  // Discount Banner
  const [bannerEnabled, setBannerEnabled] = React.useState(true)
  const [bannerText, setBannerText] = React.useState("DESCUENTO ESPECIAL PARA MIEMBROS DIAMANTE -30%")
  const [bannerButtonText, setBannerButtonText] = React.useState("SUBSCRÍBETE AHORA")
  const [bannerButtonUrl, setBannerButtonUrl] = React.useState("/registro")
  const [bannerBackgroundColor, setBannerBackgroundColor] = React.useState("#00B1DE")

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/settings/general")
      if (response.ok) {
        const data = await response.json()
        if (data.site) {
          setSiteName(data.site.name || "BUKKAKERY")
          setSiteDescription(data.site.description || "")
          setSupportEmail(data.site.supportEmail || "")
          setMaintenanceMode(data.site.maintenanceMode || false)
        }
        if (data.discountBanner) {
          setBannerEnabled(data.discountBanner.enabled ?? true)
          setBannerText(data.discountBanner.text || "DESCUENTO ESPECIAL PARA MIEMBROS DIAMANTE -30%")
          setBannerButtonText(data.discountBanner.buttonText || "SUBSCRÍBETE AHORA")
          setBannerButtonUrl(data.discountBanner.buttonUrl || "/registro")
          setBannerBackgroundColor(data.discountBanner.backgroundColor || "#00B1DE")
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
      const response = await fetch("/api/admin/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site: {
            name: siteName,
            description: siteDescription,
            supportEmail,
            maintenanceMode,
          },
          discountBanner: {
            enabled: bannerEnabled,
            text: bannerText,
            buttonText: bannerButtonText,
            buttonUrl: bannerButtonUrl,
            backgroundColor: bannerBackgroundColor,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar")
      }

      toast.success("Configuración guardada correctamente")
    } catch (error) {
      toast.error("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
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
      {/* Site Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sitio</CardTitle>
          <CardDescription>
            Opciones generales de la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Nombre del Sitio</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Email de Soporte</Label>
              <Input
                id="supportEmail"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="soporte@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">Descripción del Sitio</Label>
            <Textarea
              id="siteDescription"
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              placeholder="Descripción para SEO..."
              rows={3}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenanceMode">Modo Mantenimiento</Label>
              <p className="text-xs text-muted-foreground">
                Muestra una página de mantenimiento a los usuarios no administradores
              </p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Discount Banner */}
      <Card>
        <CardHeader>
          <CardTitle>Banner de Descuento</CardTitle>
          <CardDescription>
            Configura el banner promocional que aparece en todas las páginas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="bannerEnabled">Mostrar Banner</Label>
              <p className="text-xs text-muted-foreground">
                Muestra el banner promocional en la parte superior
              </p>
            </div>
            <Switch
              id="bannerEnabled"
              checked={bannerEnabled}
              onCheckedChange={setBannerEnabled}
            />
          </div>

          {bannerEnabled && (
            <>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="bannerText">Texto del Banner</Label>
                <Input
                  id="bannerText"
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  placeholder="DESCUENTO ESPECIAL PARA MIEMBROS DIAMANTE -30%"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bannerButtonText">Texto del Botón</Label>
                  <Input
                    id="bannerButtonText"
                    value={bannerButtonText}
                    onChange={(e) => setBannerButtonText(e.target.value)}
                    placeholder="SUBSCRÍBETE AHORA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bannerButtonUrl">URL del Botón</Label>
                  <Input
                    id="bannerButtonUrl"
                    value={bannerButtonUrl}
                    onChange={(e) => setBannerButtonUrl(e.target.value)}
                    placeholder="/registro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerBackgroundColor">Color de Fondo</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="bannerBackgroundColor"
                    value={bannerBackgroundColor}
                    onChange={(e) => setBannerBackgroundColor(e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={bannerBackgroundColor}
                    onChange={(e) => setBannerBackgroundColor(e.target.value)}
                    placeholder="#00B1DE"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Vista Previa</Label>
                <div
                  className="w-full py-3 px-4 flex flex-col md:flex-row items-center justify-between gap-3 rounded-lg"
                  style={{ backgroundColor: bannerBackgroundColor }}
                >
                  <span className="text-white font-bold text-sm uppercase tracking-wide text-center md:text-left">
                    {bannerText || "Texto del banner"}
                  </span>
                  <button className="border-2 border-white text-white px-4 py-1.5 font-bold text-xs uppercase hover:bg-white/20 transition-colors whitespace-nowrap rounded">
                    {bannerButtonText || "Botón"}
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          Guardar Configuración
        </Button>
      </div>
    </div>
  )
}
