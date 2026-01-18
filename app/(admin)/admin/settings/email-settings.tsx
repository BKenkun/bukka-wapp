"use client"

import * as React from "react"
import { IconLoader2, IconMail, IconSettings, IconCheck, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { toast } from "sonner"
import { DEFAULT_EMAIL_SETTINGS, type EmailSettings } from "@/lib/email/types"

const EMAIL_CATEGORIES = {
  auth: {
    label: "Autenticación",
    description: "Emails de registro, verificación y recuperación de contraseña",
    templates: [
      { key: "auth/verify-email", label: "Verificación de email" },
      { key: "auth/welcome", label: "Bienvenida" },
      { key: "auth/reset-password", label: "Recuperar contraseña" },
      { key: "auth/password-changed", label: "Contraseña cambiada" },
    ],
  },
  orders: {
    label: "Pedidos",
    description: "Emails relacionados con compras y pedidos",
    templates: [
      { key: "orders/confirmation", label: "Confirmación de pedido" },
      { key: "orders/payment-received", label: "Pago recibido" },
      { key: "orders/processing", label: "Pedido en proceso" },
      { key: "orders/shipped", label: "Pedido enviado" },
      { key: "orders/delivered", label: "Pedido entregado" },
      { key: "orders/cancelled", label: "Pedido cancelado" },
      { key: "orders/payment-failed", label: "Pago fallido" },
    ],
  },
  subscriptions: {
    label: "Suscripciones",
    description: "Emails de gestión de suscripciones",
    templates: [
      { key: "subscriptions/activated", label: "Suscripción activada" },
      { key: "subscriptions/renewal-reminder", label: "Recordatorio de renovación" },
      { key: "subscriptions/renewed", label: "Suscripción renovada" },
      { key: "subscriptions/cancelled", label: "Suscripción cancelada" },
      { key: "subscriptions/expired", label: "Suscripción expirada" },
      { key: "subscriptions/upgrade", label: "Upgrade confirmado" },
      { key: "subscriptions/downgrade", label: "Downgrade confirmado" },
      { key: "subscriptions/payment-failed", label: "Pago de suscripción fallido" },
    ],
  },
  casting: {
    label: "Casting",
    description: "Emails de solicitudes de casting",
    templates: [
      { key: "casting/received", label: "Solicitud recibida" },
      { key: "casting/reviewing", label: "En revisión" },
      { key: "casting/accepted", label: "Solicitud aceptada" },
      { key: "casting/rejected", label: "Solicitud rechazada" },
    ],
  },
}

export function EmailSettings() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [data, setData] = React.useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS)

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/email")
      if (response.ok) {
        const result = await response.json()
        setData(result)
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
      const response = await fetch("/api/admin/settings/email", {
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

  const updateField = <K extends keyof EmailSettings>(
    field: K,
    value: EmailSettings[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const updateTemplate = (templateKey: string, field: "subject" | "enabled", value: string | boolean) => {
    setData((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        [templateKey]: {
          ...prev.templates[templateKey],
          [field]: value,
        },
      },
    }))
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
      {/* Configuración General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSettings className="size-5" />
            Configuración General
          </CardTitle>
          <CardDescription>
            Configura los datos básicos de envío de emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromName">Nombre del remitente</Label>
              <Input
                id="fromName"
                value={data.fromName}
                onChange={(e) => updateField("fromName", e.target.value)}
                placeholder="BUKKAKERY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">Email remitente</Label>
              <Input
                id="fromEmail"
                type="email"
                value={data.fromEmail}
                onChange={(e) => updateField("fromEmail", e.target.value)}
                placeholder="noreply@bukkakery.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="replyTo">Email de respuesta (Reply-To)</Label>
            <Input
              id="replyTo"
              type="email"
              value={data.replyTo}
              onChange={(e) => updateField("replyTo", e.target.value)}
              placeholder="soporte@bukkakery.com"
            />
            <p className="text-xs text-muted-foreground">
              Cuando los usuarios respondan a los emails, se enviará a esta dirección
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo para emails</Label>
              <FileDropzone
                value={data.logoUrl}
                onChange={(url) => updateField("logoUrl", url)}
                accept="image"
                folder="settings"
                placeholder="Arrastra el logo para los emails"
              />
              <p className="text-xs text-muted-foreground">
                Se mostrará en la cabecera de todos los emails
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Color principal</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={data.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={data.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  placeholder="#FA4860"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Se usa en botones y elementos destacados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plantillas de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMail className="size-5" />
            Plantillas de Email
          </CardTitle>
          <CardDescription>
            Personaliza el asunto de cada email y activa/desactiva notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="auth" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {Object.entries(EMAIL_CATEGORIES).map(([key, category]) => (
                <TabsTrigger key={key} value={key}>
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(EMAIL_CATEGORIES).map(([categoryKey, category]) => (
              <TabsContent key={categoryKey} value={categoryKey} className="mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description}
                </p>
                <div className="space-y-4">
                  {category.templates.map((template) => {
                    const templateData = data.templates[template.key] || {
                      subject: "",
                      enabled: true,
                    }
                    return (
                      <div
                        key={template.key}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <Switch
                          checked={templateData.enabled}
                          onCheckedChange={(checked) =>
                            updateTemplate(template.key, "enabled", checked)
                          }
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">{template.label}</Label>
                            {templateData.enabled ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <IconCheck className="size-3" />
                                Activo
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <IconX className="size-3" />
                                Desactivado
                              </span>
                            )}
                          </div>
                          <Input
                            value={templateData.subject}
                            onChange={(e) =>
                              updateTemplate(template.key, "subject", e.target.value)
                            }
                            placeholder="Asunto del email..."
                            disabled={!templateData.enabled}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
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
