"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { IconLoader2, IconTruck, IconFileDownload, IconRefresh } from "@tabler/icons-react"

interface Rate {
  id: number
  carrierName: string
  serviceName: string
  totalPrice: number
  currency: string
  transitTime: string | null
}

interface PacklinkData {
  reference: string | null
  labels: string[]
  rates: Rate[]
  defaultPackage: { weight: number }
}

export function PacklinkPanel({ orderId }: { orderId: string }) {
  const [data, setData] = React.useState<PacklinkData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [serviceId, setServiceId] = React.useState<string>("")
  const [weight, setWeight] = React.useState<string>("")
  const [loaded, setLoaded] = React.useState(false)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/packlink`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Error consultando Packlink")
        setData(null)
        return
      }
      setData(json)
      setLoaded(true)
    } catch {
      setError("Error consultando Packlink")
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  const handleCreate = async () => {
    if (!serviceId) return
    setIsCreating(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/packlink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: Number(serviceId),
          weight: weight ? Number(weight) : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Error creando el envío")
        return
      }
      toast.success(`Envío creado en Packlink (${json.reference})`)
      await load()
    } catch {
      toast.error("Error creando el envío")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTruck className="size-5" />
          Packlink PRO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loaded ? (
          <Button variant="outline" onClick={load} disabled={isLoading} className="w-full">
            {isLoading ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <IconRefresh className="mr-2 size-4" />
            )}
            Consultar tarifas de envío
          </Button>
        ) : null}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {data?.reference ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Envío creado</p>
              <Badge variant="default" className="mt-1 font-mono">
                {data.reference}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Completa el pago y la etiqueta desde el panel de Packlink PRO si aún no lo has hecho.
              </p>
            </div>
            {data.labels.length > 0 ? (
              <div className="space-y-1">
                {data.labels.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <IconFileDownload className="size-4" />
                    Etiqueta {i + 1} (PDF)
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sin etiquetas disponibles todavía (se generan al pagar el envío en Packlink).
              </p>
            )}
            <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
              {isLoading && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Actualizar
            </Button>
          </div>
        ) : loaded && data ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Tarifa</label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige transportista..." />
                </SelectTrigger>
                <SelectContent>
                  {data.rates.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.carrierName} · {r.serviceName} — {r.totalPrice.toFixed(2)} {r.currency}
                      {r.transitTime ? ` (${r.transitTime})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {data.rates.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No hay tarifas disponibles para esta dirección.
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Peso del paquete (kg)</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={String(data.defaultPackage?.weight ?? 1)}
              />
            </div>
            <Button onClick={handleCreate} disabled={!serviceId || isCreating} className="w-full">
              {isCreating && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Crear envío en Packlink
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
