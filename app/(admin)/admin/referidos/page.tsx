"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  IconPlus,
  IconLoader2,
  IconTrash,
  IconExternalLink,
  IconCopy,
} from "@tabler/icons-react"

interface PerformerOption {
  id: string
  name: string
  slug: string
  profileImage: string | null
}

interface ReferralCode {
  id: string
  code: string
  performer: PerformerOption | null
  partnerName: string | null
  ownerType: "performer" | "partner"
  ownerName: string
  discountPercent: number
  label: string | null
  isActive: boolean
  maxUses: number | null
  usedCount: number
  totalClicks: number
  totalRevenue: number
  startDate: string | null
  endDate: string | null
  createdAt: string
  counts: { conversions: number; orders: number; subscriptions: number }
}

type OwnerKind = "performer" | "partner"

const initialForm = {
  code: "",
  ownerKind: "performer" as OwnerKind,
  performerId: "",
  partnerName: "",
  discountPercent: "10",
  label: "",
  isActive: true,
  maxUses: "",
  startDate: "",
  endDate: "",
}

export default function ReferidosAdminPage() {
  const [codes, setCodes] = React.useState<ReferralCode[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const [form, setForm] = React.useState(initialForm)
  const [performerQuery, setPerformerQuery] = React.useState("")
  const [performerResults, setPerformerResults] = React.useState<PerformerOption[]>([])
  const [selectedPerformer, setSelectedPerformer] = React.useState<PerformerOption | null>(null)
  const [searchingPerformers, setSearchingPerformers] = React.useState(false)

  React.useEffect(() => {
    fetchCodes()
  }, [])

  async function fetchCodes() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/referral-codes")
      const data = await res.json()
      setCodes(data.codes || [])
    } catch {
      toast.error("Error al cargar códigos")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    const t = setTimeout(async () => {
      if (!isDialogOpen || form.ownerKind !== "performer") return
      setSearchingPerformers(true)
      try {
        const res = await fetch(
          `/api/admin/performers/search?q=${encodeURIComponent(performerQuery)}&limit=12`,
        )
        const data = await res.json()
        setPerformerResults(data.performers || [])
      } catch {
        setPerformerResults([])
      } finally {
        setSearchingPerformers(false)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [performerQuery, isDialogOpen, form.ownerKind])

  function openCreateDialog() {
    setForm(initialForm)
    setSelectedPerformer(null)
    setPerformerQuery("")
    setIsDialogOpen(true)
  }

  function pickPerformer(p: PerformerOption) {
    setSelectedPerformer(p)
    setForm((prev) => ({
      ...prev,
      performerId: p.id,
      code: prev.code || suggestCode(p.slug || p.name),
    }))
  }

  function suggestCode(name: string) {
    const base = (name || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12)
    return base ? `${base}10` : ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.ownerKind === "performer" && !form.performerId) {
      toast.error("Selecciona una modelo")
      return
    }
    if (form.ownerKind === "partner" && !form.partnerName.trim()) {
      toast.error("Introduce el nombre del tercero")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/referral-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          performerId: form.ownerKind === "performer" ? form.performerId : null,
          partnerName: form.ownerKind === "partner" ? form.partnerName.trim() : null,
          discountPercent: Number(form.discountPercent) || 0,
          label: form.label.trim() || null,
          isActive: form.isActive,
          maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Error al crear")
      }
      toast.success("Código creado")
      setIsDialogOpen(false)
      fetchCodes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este código? Las conversiones quedarán sin atribución.")) return
    try {
      const res = await fetch(`/api/admin/referral-codes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Código eliminado")
      fetchCodes()
    } catch {
      toast.error("Error al eliminar")
    }
  }

  async function toggleActive(code: ReferralCode) {
    try {
      const res = await fetch(`/api/admin/referral-codes/${code.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !code.isActive }),
      })
      if (!res.ok) throw new Error()
      fetchCodes()
    } catch {
      toast.error("Error al actualizar")
    }
  }

  function copyShareLink(code: string) {
    const url = `${window.location.origin}/?ref=${encodeURIComponent(code)}`
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Enlace copiado"))
      .catch(() => toast.error("No se pudo copiar"))
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Códigos de Referido</h1>
          <p className="text-muted-foreground">
            Códigos asignados a modelos para atribuir suscripciones y compras
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <IconPlus className="mr-2 size-4" />
              Nuevo código
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg text-foreground">
            <DialogHeader>
              <DialogTitle>Nuevo código de referido</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de dueño *</label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        ownerKind: "performer",
                        partnerName: "",
                      }))
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                      form.ownerKind === "performer"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    Modelo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        ownerKind: "partner",
                        performerId: "",
                      }))
                      setSelectedPerformer(null)
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                      form.ownerKind === "partner"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    Tercero (representante, agencia...)
                  </button>
                </div>
              </div>

              {form.ownerKind === "performer" ? (
                <div>
                  <label className="text-sm font-medium">Modelo *</label>
                  <Input
                    value={performerQuery}
                    onChange={(e) => {
                      setPerformerQuery(e.target.value)
                      setSelectedPerformer(null)
                      setForm((prev) => ({ ...prev, performerId: "" }))
                    }}
                    placeholder="Buscar modelo por nombre..."
                  />
                  {selectedPerformer ? (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded border bg-muted/40">
                      {selectedPerformer.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedPerformer.profileImage}
                          alt={selectedPerformer.name}
                          className="size-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-6 rounded-full bg-muted" />
                      )}
                      <span className="text-sm font-medium">
                        {selectedPerformer.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPerformer(null)
                          setForm((prev) => ({ ...prev, performerId: "" }))
                        }}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded border">
                      {searchingPerformers ? (
                        <div className="p-3 text-xs text-muted-foreground">
                          Buscando...
                        </div>
                      ) : performerResults.length === 0 ? (
                        <div className="p-3 text-xs text-muted-foreground">
                          Sin resultados
                        </div>
                      ) : (
                        performerResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => pickPerformer(p)}
                            className="w-full flex items-center gap-2 p-2 text-left hover:bg-muted text-sm"
                          >
                            {p.profileImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.profileImage}
                                alt={p.name}
                                className="size-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="size-6 rounded-full bg-muted" />
                            )}
                            <span>{p.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {p.slug}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium">
                    Nombre del tercero *
                  </label>
                  <Input
                    value={form.partnerName}
                    onChange={(e) => {
                      const v = e.target.value
                      setForm((prev) => ({
                        ...prev,
                        partnerName: v,
                        code: prev.code || suggestCode(v),
                      }))
                    }}
                    placeholder="Ej: Juan Pérez (representante)"
                    maxLength={120}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Texto libre. Se usará para identificar al dueño en
                    métricas y en el badge del cupón.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Código *</label>
                  <Input
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    placeholder="ALEXA10"
                    required
                    maxLength={32}
                  />
                </div>
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
              </div>

              <div>
                <label className="text-sm font-medium">
                  Etiqueta visible (opcional)
                </label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Ej: Cupón creadora Alexa"
                  maxLength={80}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Si se deja vacío se mostrará automáticamente «Cupón creadora
                  &lt;nombre&gt; · X%» o «Cupón referido &lt;nombre&gt;» si el
                  descuento es 0%.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <label className="text-sm font-medium">Activo</label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                  Crear
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Conversiones</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Ingresos</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <IconLoader2 className="size-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : codes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aún no hay códigos de referido
                </TableCell>
              </TableRow>
            ) : (
              codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold">
                    <Link
                      href={`/admin/referidos/${c.id}`}
                      className="hover:underline"
                    >
                      {c.code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {c.performer?.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.performer.profileImage}
                          alt={c.ownerName}
                          className="size-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">
                          {c.ownerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm">{c.ownerName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          {c.ownerType === "performer" ? "Modelo" : "Tercero"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.discountPercent > 0 ? (
                      <Badge variant="default">{c.discountPercent}%</Badge>
                    ) : (
                      <Badge variant="outline">Solo tracking</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.counts.conversions} ({c.counts.orders} pedidos ·{" "}
                    {c.counts.subscriptions} subs)
                  </TableCell>
                  <TableCell className="text-sm">{c.totalClicks}</TableCell>
                  <TableCell className="text-sm">
                    {c.totalRevenue.toFixed(2)} €
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={c.isActive}
                      onCheckedChange={() => toggleActive(c)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Copiar enlace ?ref="
                        onClick={() => copyShareLink(c.code)}
                      >
                        <IconCopy className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/admin/referidos/${c.id}`}
                          title="Ver métricas"
                        >
                          <IconExternalLink className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
