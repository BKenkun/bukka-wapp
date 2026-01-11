"use client"

import * as React from "react"
import { IconLoader2, IconCheck, IconAlertTriangle, IconCreditCard, IconSettings } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { toast } from "sonner"

interface Gateway {
  id: string
  name: string
  description: string
  isHighRisk: boolean
  status: "active" | "inactive" | "pending"
  fields: GatewayField[]
}

interface GatewayField {
  key: string
  label: string
  type: "text" | "password" | "select"
  placeholder?: string
  options?: { value: string; label: string }[]
  required?: boolean
}

const GATEWAYS: Gateway[] = [
  {
    id: "ccbill",
    name: "CCBill",
    description: "Líder en procesamiento de pagos para contenido adulto",
    isHighRisk: true,
    status: "inactive",
    fields: [
      { key: "clientAccnum", label: "Client Account Number", type: "text", required: true },
      { key: "clientSubacc", label: "Client Subaccount", type: "text", required: true },
      { key: "formName", label: "Form Name", type: "text", required: true },
      { key: "salt", label: "Salt/Secret", type: "password", required: true },
      { key: "webhookSecret", label: "Webhook Secret", type: "password", required: true },
    ],
  },
  {
    id: "epoch",
    name: "Epoch",
    description: "Procesador de pagos internacional para adultos",
    isHighRisk: true,
    status: "inactive",
    fields: [
      { key: "memberId", label: "Member ID", type: "text", required: true },
      { key: "clientId", label: "Client ID", type: "text", required: true },
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "webhookSecret", label: "Webhook Secret", type: "password", required: true },
    ],
  },
  {
    id: "segpay",
    name: "Segpay",
    description: "Pagos seguros para contenido premium",
    isHighRisk: true,
    status: "inactive",
    fields: [
      { key: "merchantId", label: "Merchant ID", type: "text", required: true },
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "packageId", label: "Package ID", type: "text", required: true },
      { key: "webhookSecret", label: "Webhook Secret", type: "password", required: true },
    ],
  },
  {
    id: "rocketgate",
    name: "RocketGate",
    description: "Gateway de alto volumen para suscripciones",
    isHighRisk: true,
    status: "inactive",
    fields: [
      { key: "merchantId", label: "Merchant ID", type: "text", required: true },
      { key: "merchantPassword", label: "Merchant Password", type: "password", required: true },
      { key: "webhookSecret", label: "Webhook Secret", type: "password", required: true },
    ],
  },
  {
    id: "centrobill",
    name: "Centrobill",
    description: "Solución europea para pagos recurrentes",
    isHighRisk: true,
    status: "inactive",
    fields: [
      { key: "siteId", label: "Site ID", type: "text", required: true },
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "secretKey", label: "Secret Key", type: "password", required: true },
    ],
  },
  {
    id: "probiller",
    name: "Probiller",
    description: "Procesador de pagos para entretenimiento adulto",
    isHighRisk: true,
    status: "inactive",
    fields: [
      { key: "siteId", label: "Site ID", type: "text", required: true },
      { key: "billerCode", label: "Biller Code", type: "text", required: true },
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
  },
]

interface GatewayConfig {
  [gatewayId: string]: {
    enabled: boolean
    config: { [key: string]: string }
  }
}

export function PaymentGatewaysSettings() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [gatewayConfigs, setGatewayConfigs] = React.useState<GatewayConfig>({})
  const [defaultGateway, setDefaultGateway] = React.useState<string>("")
  const [testMode, setTestMode] = React.useState(true)

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/settings/payment-gateways")
      if (response.ok) {
        const data = await response.json()
        setGatewayConfigs(data.gateways || {})
        setDefaultGateway(data.defaultGateway || "")
        setTestMode(data.testMode ?? true)
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
      const response = await fetch("/api/admin/settings/payment-gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateways: gatewayConfigs,
          defaultGateway,
          testMode,
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

  const toggleGateway = (gatewayId: string) => {
    setGatewayConfigs((prev) => ({
      ...prev,
      [gatewayId]: {
        ...prev[gatewayId],
        enabled: !prev[gatewayId]?.enabled,
        config: prev[gatewayId]?.config || {},
      },
    }))
  }

  const updateGatewayField = (gatewayId: string, field: string, value: string) => {
    setGatewayConfigs((prev) => ({
      ...prev,
      [gatewayId]: {
        ...prev[gatewayId],
        enabled: prev[gatewayId]?.enabled || false,
        config: {
          ...prev[gatewayId]?.config,
          [field]: value,
        },
      },
    }))
  }

  const enabledGateways = GATEWAYS.filter((g) => gatewayConfigs[g.id]?.enabled)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pasarelas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{enabledGateways.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gateway por Defecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {defaultGateway ? GATEWAYS.find((g) => g.id === defaultGateway)?.name : "Sin definir"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Modo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={testMode ? "secondary" : "default"}>
              {testMode ? "Test/Sandbox" : "Producción"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSettings className="size-5" />
            Configuración Global
          </CardTitle>
          <CardDescription>
            Opciones que afectan a todas las pasarelas de pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="testMode">Modo de Pruebas</Label>
              <p className="text-xs text-muted-foreground">
                Activa el modo sandbox para todas las pasarelas
              </p>
            </div>
            <Switch
              id="testMode"
              checked={testMode}
              onCheckedChange={setTestMode}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Pasarela por Defecto para Suscripciones</Label>
            <Select value={defaultGateway} onValueChange={setDefaultGateway}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Selecciona una pasarela" />
              </SelectTrigger>
              <SelectContent>
                {enabledGateways.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No hay pasarelas activas
                  </SelectItem>
                ) : (
                  enabledGateways.map((gateway) => (
                    <SelectItem key={gateway.id} value={gateway.id}>
                      {gateway.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Esta pasarela se usará para procesar las suscripciones nuevas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Warning about high-risk */}
      <Alert>
        <IconAlertTriangle className="size-4" />
        <AlertTitle>Pasarelas de Alto Riesgo</AlertTitle>
        <AlertDescription>
          Todas las pasarelas listadas están especializadas en procesamiento de pagos high-risk
          para contenido adulto. Asegúrate de tener los contratos correctos con cada proveedor
          antes de activarlas.
        </AlertDescription>
      </Alert>

      {/* Gateway Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCreditCard className="size-5" />
            Pasarelas de Pago
          </CardTitle>
          <CardDescription>
            Configura las credenciales de cada pasarela
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {GATEWAYS.map((gateway) => {
              const config = gatewayConfigs[gateway.id]
              const isEnabled = config?.enabled || false

              return (
                <AccordionItem key={gateway.id} value={gateway.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{gateway.name}</span>
                          {isEnabled && (
                            <Badge variant="outline" className="text-green-500 border-green-500/30">
                              <IconCheck className="size-3 mr-1" />
                              Activa
                            </Badge>
                          )}
                          <Badge variant="secondary">High-Risk</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">
                          {gateway.description}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor={`enable-${gateway.id}`}>Activar {gateway.name}</Label>
                          <p className="text-xs text-muted-foreground">
                            Habilita esta pasarela para procesar pagos
                          </p>
                        </div>
                        <Switch
                          id={`enable-${gateway.id}`}
                          checked={isEnabled}
                          onCheckedChange={() => toggleGateway(gateway.id)}
                        />
                      </div>

                      {isEnabled && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gateway.fields.map((field) => (
                              <div key={field.key} className="space-y-2">
                                <Label htmlFor={`${gateway.id}-${field.key}`}>
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                <Input
                                  id={`${gateway.id}-${field.key}`}
                                  type={field.type}
                                  placeholder={field.placeholder}
                                  value={config?.config?.[field.key] || ""}
                                  onChange={(e) =>
                                    updateGatewayField(gateway.id, field.key, e.target.value)
                                  }
                                />
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" size="sm">
                              Probar Conexión
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
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
