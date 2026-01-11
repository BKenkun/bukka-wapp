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

  // Age Verification
  const [ageVerificationEnabled, setAgeVerificationEnabled] = React.useState(true)
  const [ageVerificationText, setAgeVerificationText] = React.useState(
    "Este sitio web contiene material para adultos. Al entrar, confirmas que tienes al menos 18 años de edad."
  )

  // Legal
  const [companyName, setCompanyName] = React.useState("NEON BULB, S.L.")
  const [companyAddress, setCompanyAddress] = React.useState("")
  const [companyVAT, setCompanyVAT] = React.useState("")

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
        if (data.ageVerification) {
          setAgeVerificationEnabled(data.ageVerification.enabled ?? true)
          setAgeVerificationText(data.ageVerification.text || "")
        }
        if (data.company) {
          setCompanyName(data.company.name || "")
          setCompanyAddress(data.company.address || "")
          setCompanyVAT(data.company.vat || "")
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
          ageVerification: {
            enabled: ageVerificationEnabled,
            text: ageVerificationText,
          },
          company: {
            name: companyName,
            address: companyAddress,
            vat: companyVAT,
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

      {/* Age Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Verificación de Edad</CardTitle>
          <CardDescription>
            Configura el popup de verificación +18
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ageVerificationEnabled">Activar Verificación de Edad</Label>
              <p className="text-xs text-muted-foreground">
                Muestra un popup de verificación de edad al entrar al sitio
              </p>
            </div>
            <Switch
              id="ageVerificationEnabled"
              checked={ageVerificationEnabled}
              onCheckedChange={setAgeVerificationEnabled}
            />
          </div>

          {ageVerificationEnabled && (
            <div className="space-y-2">
              <Label htmlFor="ageVerificationText">Texto del Popup</Label>
              <Textarea
                id="ageVerificationText"
                value={ageVerificationText}
                onChange={(e) => setAgeVerificationText(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
          <CardDescription>
            Datos legales de la empresa para facturación y cumplimiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nombre de la Empresa</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress">Dirección</Label>
            <Textarea
              id="companyAddress"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyVAT">CIF/NIF/VAT</Label>
            <Input
              id="companyVAT"
              value={companyVAT}
              onChange={(e) => setCompanyVAT(e.target.value)}
              placeholder="ESB12345678"
            />
          </div>
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
