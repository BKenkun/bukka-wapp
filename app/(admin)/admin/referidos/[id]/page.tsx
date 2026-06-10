"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconLoader2,
  IconCopy,
  IconShoppingBag,
  IconReceipt,
} from "@tabler/icons-react"

interface ReferralCode {
  id: string
  code: string
  performer: {
    id: string
    name: string
    slug: string
    profileImage: string | null
  } | null
  partnerName: string | null
  ownerType: "performer" | "partner"
  ownerName: string
  discountPercent: number
  commissionPercent: number
  label: string | null
  isActive: boolean
  maxUses: number | null
  usedCount: number
  totalClicks: number
  totalRevenue: number
  startDate: string | null
  endDate: string | null
  createdAt: string
}

interface Conversion {
  id: string
  type: "SHOP_PURCHASE" | "SUBSCRIPTION"
  amount: number
  discountAmount: number
  commissionAmount: number
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
  order: {
    id: string
    orderNumber: string
    total: number
    paymentStatus: string
    createdAt: string
  } | null
  subscriptionHistory: {
    id: string
    amount: number
    createdAt: string
    plan: { id: string; name: string; slug: string } | null
  } | null
}

interface ConversionsResponse {
  code: {
    id: string
    code: string
    totalClicks: number
    totalRevenue: number
    usedCount: number
  }
  summary: {
    conversions: number
    shopCount: number
    subscriptionCount: number
    totalRevenue: number
    commissionCurrentMonth: number
    commissionPreviousMonth: number
    commissionTotal: number
  }
  monthlyHistory: {
    month: string
    revenue: number
    commission: number
    conversions: number
  }[]
  conversions: Conversion[]
}

export default function ReferralDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [code, setCode] = React.useState<ReferralCode | null>(null)
  const [data, setData] = React.useState<ConversionsResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    discountPercent: "0",
    commissionPercent: "0",
    partnerName: "",
    label: "",
    isActive: true,
    maxUses: "",
    startDate: "",
    endDate: "",
  })

  React.useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function fetchAll() {
    setLoading(true)
    try {
      const [c, conv] = await Promise.all([
        fetch(`/api/admin/referral-codes/${id}`).then((r) => r.json()),
        fetch(`/api/admin/referral-codes/${id}/conversions`).then((r) => r.json()),
      ])
      if (c?.code) {
        setCode(c.code)
        setForm({
          discountPercent: String(c.code.discountPercent ?? 0),
          commissionPercent: String(c.code.commissionPercent ?? 0),
          partnerName: c.code.partnerName ?? "",
          label: c.code.label ?? "",
          isActive: c.code.isActive,
          maxUses: c.code.maxUses ? String(c.code.maxUses) : "",
          startDate: c.code.startDate ? c.code.startDate.split("T")[0] : "",
          endDate: c.code.endDate ? c.code.endDate.split("T")[0] : "",
        })
      }
      if (conv?.summary) setData(conv)
    } catch {
      toast.error("Error al cargar")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/referral-codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountPercent: Number(form.discountPercent) || 0,
          commissionPercent: Number(form.commissionPercent) || 0,
          partnerName:
            code?.ownerType === "partner"
              ? form.partnerName.trim() || null
              : undefined,
          label: form.label.trim() || null,
          isActive: form.isActive,
          maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Cambios guardados")
      fetchAll()
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    if (!code) return
    const url = `${window.location.origin}/?ref=${encodeURIComponent(code.code)}`
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Enlace copiado"))
      .catch(() => toast.error("No se pudo copiar"))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <IconLoader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!code) {
    return (
      <div className="px-4 lg:px-6">
        <p className="text-muted-foreground">Código no encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/referidos")}
          >
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {code.code}
            </h1>
            <p className="text-muted-foreground text-sm">
              {code.ownerType === "performer" ? "Modelo: " : "Tercero: "}
              {code.ownerType === "performer" ? (
                <Link
                  href={`/admin/actrices`}
                  className="hover:underline text-foreground"
                >
                  {code.ownerName}
                </Link>
              ) : (
                <span className="text-foreground">{code.ownerName}</span>
              )}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={copyLink}>
          <IconCopy className="mr-2 size-4" />
          Copiar enlace ?ref=
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Conversiones" value={data?.summary.conversions ?? 0} />
        <MetricCard
          label="Pedidos"
          value={data?.summary.shopCount ?? 0}
          icon={<IconShoppingBag className="size-5" />}
        />
        <MetricCard
          label="Suscripciones"
          value={data?.summary.subscriptionCount ?? 0}
          icon={<IconReceipt className="size-5" />}
        />
        <MetricCard
          label="Ingresos atribuidos"
          value={`${(data?.summary.totalRevenue ?? 0).toFixed(2)} €`}
        />
        <MetricCard label="Clicks (?ref=)" value={code.totalClicks} />
        <MetricCard label="Usos confirmados" value={code.usedCount} />
        <MetricCard
          label="Límite"
          value={code.maxUses ? `${code.usedCount}/${code.maxUses}` : "∞"}
        />
        <MetricCard
          label="Estado"
          value={
            code.isActive ? (
              <Badge variant="default">Activo</Badge>
            ) : (
              <Badge variant="secondary">Inactivo</Badge>
            )
          }
        />
      </div>

      {/* Comisiones a pagar al creador/partner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="% Comisión"
          value={`${Number(form.commissionPercent) || code.commissionPercent || 0} %`}
        />
        <MetricCard
          label="Comisión mes actual"
          value={`${(data?.summary.commissionCurrentMonth ?? 0).toFixed(2)} €`}
        />
        <MetricCard
          label="Comisión mes anterior"
          value={`${(data?.summary.commissionPreviousMonth ?? 0).toFixed(2)} €`}
        />
        <MetricCard
          label="Comisión acumulada"
          value={`${(data?.summary.commissionTotal ?? 0).toFixed(2)} €`}
        />
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {code.ownerType === "partner" && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Nombre del tercero</label>
                <Input
                  value={form.partnerName}
                  onChange={(e) =>
                    setForm({ ...form, partnerName: e.target.value })
                  }
                  placeholder="Nombre del representante / agencia"
                  maxLength={120}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Descuento (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.discountPercent}
                onChange={(e) =>
                  setForm({ ...form, discountPercent: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Comisión creador (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.commissionPercent}
                onChange={(e) =>
                  setForm({ ...form, commissionPercent: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                % sobre los ingresos generados que se paga al creador/partner
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Etiqueta visible</label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Cupón creadora Alexa"
                maxLength={80}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Usos máximos</label>
              <Input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="∞"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Inicio</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fin</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <label className="text-sm font-medium">Activo</label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico mensual de ingresos y comisiones */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico mensual</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">Conversiones</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data?.monthlyHistory?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Sin datos todavía
                  </TableCell>
                </TableRow>
              ) : (
                data.monthlyHistory.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="font-medium">
                      {new Date(`${m.month}-01T00:00:00`).toLocaleDateString("es-ES", {
                        month: "long",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">{m.conversions}</TableCell>
                    <TableCell className="text-right">{m.revenue.toFixed(2)} €</TableCell>
                    <TableCell className="text-right font-semibold">
                      {m.commission.toFixed(2)} €
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Conversiones */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas conversiones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead className="text-right">Descuento</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data?.conversions.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Sin conversiones todavía
                  </TableCell>
                </TableRow>
              ) : (
                data.conversions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">
                      {new Date(c.createdAt).toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell>
                      {c.type === "SHOP_PURCHASE" ? (
                        <Badge variant="outline">Tienda</Badge>
                      ) : (
                        <Badge variant="default">Suscripción</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.user
                        ? c.user.name || c.user.email
                        : c.order
                          ? "Invitado"
                          : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.order ? (
                        <Link
                          href={`/admin/orders/${c.order.id}`}
                          className="hover:underline font-mono"
                        >
                          #{c.order.orderNumber}
                        </Link>
                      ) : c.subscriptionHistory?.plan ? (
                        c.subscriptionHistory.plan.name
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.amount.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {c.discountAmount > 0
                        ? `-${c.discountAmount.toFixed(2)} €`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {c.commissionAmount > 0
                        ? `${c.commissionAmount.toFixed(2)} €`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          {icon}
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </CardContent>
    </Card>
  )
}
