"use client"

import * as React from "react"
import { IconLoader2, IconShieldCheck, IconEye } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface AgeVerificationData {
  enabled: boolean
  okysafeEnabled: boolean
  title: string
  description: string
  enterButtonText: string
  exitButtonText: string
  exitUrl: string
}

const DEFAULT_DATA: AgeVerificationData = {
  enabled: true,
  okysafeEnabled: true,
  title: "Este es un Sitio Web para adultos",
  description: "Este sitio web contiene material restringido a menores de edad, que incluye desnudez y representaciones explícitas de actividad sexual. Al entrar, afirma que tiene por lo menos 18 años de edad o la mayoría de edad en la jurisdicción desde que está accediendo el sitio web y que da consentimiento en ver contenido sexualmente explícito.",
  enterButtonText: "Tengo 18 años o más - Entrar",
  exitButtonText: "Soy menor de 18 años - Salir",
  exitUrl: "https://www.google.com",
}

export function AgeVerificationSettings() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [data, setData] = React.useState<AgeVerificationData>(DEFAULT_DATA)

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/age-verification")
      if (response.ok) {
        const result = await response.json()
        setData({ ...DEFAULT_DATA, ...result })
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
      const response = await fetch("/api/admin/settings/age-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

  const updateField = (field: keyof AgeVerificationData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }))
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
      {/* Estado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShieldCheck className="size-5" />
            Verificación de Edad
          </CardTitle>
          <CardDescription>
            Configura el modal de verificación de edad que se muestra al entrar al sitio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activar verificación de edad</Label>
              <p className="text-sm text-muted-foreground">
                Muestra el modal de verificación antes de acceder al contenido
              </p>
            </div>
            <Switch
              checked={data.enabled}
              onCheckedChange={(checked) => updateField("enabled", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Verificación con OkySafe</Label>
              <p className="text-sm text-muted-foreground">
                Usa OkySafe para verificar la edad por email. Si se desactiva, se muestra un verificador simple con aceptación de términos.
              </p>
            </div>
            <Switch
              checked={data.okysafeEnabled}
              onCheckedChange={(checked) => updateField("okysafeEnabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Modal */}
      <Card>
        <CardHeader>
          <CardTitle>Contenido del Modal</CardTitle>
          <CardDescription>
            Textos que se muestran en el modal de verificación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Este es un Sitio Web para adultos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Descripción del aviso de contenido para adultos..."
              rows={4}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enterButtonText">Texto botón "Entrar"</Label>
              <Input
                id="enterButtonText"
                value={data.enterButtonText}
                onChange={(e) => updateField("enterButtonText", e.target.value)}
                placeholder="Tengo 18 años o más - Entrar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitButtonText">Texto botón "Salir"</Label>
              <Input
                id="exitButtonText"
                value={data.exitButtonText}
                onChange={(e) => updateField("exitButtonText", e.target.value)}
                placeholder="Soy menor de 18 años - Salir"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exitUrl">URL de salida (cuando pulsa "Salir")</Label>
            <Input
              id="exitUrl"
              value={data.exitUrl}
              onChange={(e) => updateField("exitUrl", e.target.value)}
              placeholder="https://www.google.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vista previa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconEye className="size-5" />
            Vista Previa
          </CardTitle>
          <CardDescription>
            Así se verá el modal de verificación de edad
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data.okysafeEnabled ? (
            <div className="bg-[#222222] rounded-2xl p-6 text-left" style={{ fontFamily: "Montserrat, sans-serif" }}>
              <h1 className="text-center text-white font-black mb-1" style={{ fontSize: "24px" }}>
                BUKKAKERY
              </h1>
              <h2 className="text-center font-bold mb-4" style={{ fontSize: "12px", color: "#6CB4D9" }}>
                WARNING: THIS WEBSITE IS FOR ADULTS ONLY!
              </h2>
              <p className="text-white/80 text-xs mb-3" style={{ lineHeight: 1.5 }}>
                This Website is for use solely by individuals who are at least 18 years of age...
              </p>
              <p className="text-white font-bold text-xs mb-2">
                BY CLICKING &ldquo;YES, I&rsquo;M OLDER THAN 18&rdquo; BELOW, YOU STATE THAT...
              </p>
              <ul className="text-white/80 text-xs list-disc pl-4 mb-3 space-y-1" style={{ lineHeight: 1.4 }}>
                <li>You are at least 18 years of age...</li>
                <li>You will promptly leave this Website...</li>
                <li>You will not hold the Website&rsquo;s owners responsible...</li>
                <li>You acknowledge the Terms of Service...</li>
              </ul>
              <div className="flex gap-3 mt-4">
                <span className="flex-1 py-2 rounded-lg border border-white/30 text-white text-xs font-semibold text-center">
                  No
                </span>
                <span className="flex-1 py-2 rounded-lg text-white text-xs font-semibold text-center" style={{ backgroundColor: "#5BA8C8" }}>
                  Yes, I&rsquo;m older than 18
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-black rounded-lg p-8 text-center">
              <h1
                className="text-[#FA4860] font-black mb-4"
                style={{ fontFamily: "Montserrat", fontSize: "28px" }}
              >
                BUKKAKERY
              </h1>
              <h2
                className="text-white font-bold mb-4"
                style={{ fontFamily: "Montserrat", fontSize: "20px" }}
              >
                {data.title}
              </h2>
              <p
                className="text-white/80 mb-6 text-sm max-w-md mx-auto"
                style={{ fontFamily: "Montserrat" }}
              >
                {data.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <span className="px-4 py-2 border-2 border-[#FA4860] bg-[#FA4860] text-white text-sm font-bold">
                  {data.enterButtonText}
                </span>
                <span className="px-4 py-2 border-2 border-[#FA4860] bg-transparent text-white text-sm font-bold">
                  {data.exitButtonText}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>
    </div>
  )
}
