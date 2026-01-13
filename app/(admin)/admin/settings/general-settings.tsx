"use client"

import * as React from "react"
import { IconLoader2, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { LocalUploadButton } from "@/components/local-upload-button"

export function GeneralSettings() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Site Settings
  const [siteName, setSiteName] = React.useState("BUKKAKERY")
  const [seoTitle, setSeoTitle] = React.useState("")
  const [seoDescription, setSeoDescription] = React.useState("")
  const [favicon, setFavicon] = React.useState("")
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
          setSeoTitle(data.site.seoTitle || "")
          setSeoDescription(data.site.seoDescription || "")
          setFavicon(data.site.favicon || "")
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
            seoTitle,
            seoDescription,
            favicon,
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

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SEO y Metadatos</CardTitle>
          <CardDescription>
            Configura los metadatos para buscadores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">Título SEO</Label>
            <Input
              id="seoTitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Título que aparece en los resultados de búsqueda"
            />
            <p className="text-xs text-muted-foreground">
              Recomendado: 50-60 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoDescription">Descripción SEO</Label>
            <Textarea
              id="seoDescription"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Descripción que aparece en los resultados de búsqueda..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Recomendado: 150-160 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label>Favicon</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Icono que aparece en la pestaña del navegador (formato .ico, .png o .svg, max 512KB)
            </p>

            {favicon ? (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <img
                  src={favicon}
                  alt="Favicon preview"
                  className="w-12 h-12 object-contain border rounded bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.png'
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Favicon actual</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[300px]">{favicon}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setFavicon("")}
                >
                  <IconX className="size-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            ) : (
              <LocalUploadButton
                folder="favicon"
                accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                buttonText="Subir Favicon"
                maxSize="512KB"
                onUploadComplete={(result) => {
                  setFavicon(result.url)
                  toast.success("Favicon subido correctamente")
                }}
                onUploadError={(error) => {
                  toast.error(error.message)
                }}
              />
            )}
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
