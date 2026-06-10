"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { IconLoader2, IconArrowLeft } from "@tabler/icons-react"
import { PacklinkPanel } from "./packlink-panel"

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    slug: string
    images: string[]
  }
}

interface Order {
  id: string
  orderNumber: string
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
  paymentGateway: string | null
  subtotal: number
  discount: number
  total: number
  shippingAddress: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
  } | null
  trackingNumber: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    subscriptionPlan?: {
      name: string
      slug: string
    } | null
  } | null
  guestEmail: string | null
  guestName: string | null
  items: OrderItem[]
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500",
  PROCESSING: "bg-blue-500",
  SHIPPED: "bg-purple-500",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-500",
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-500",
  PAID: "bg-green-500",
  FAILED: "bg-red-500",
  REFUNDED: "bg-purple-500",
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = React.useState<Order | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    status: "",
    paymentStatus: "",
    trackingNumber: "",
  })

  React.useEffect(() => {
    fetchOrder()
  }, [params.id])

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`)
      if (!res.ok) throw new Error("Order not found")
      const data = await res.json()
      setOrder(data.order)
      setFormData({
        status: data.order.status,
        paymentStatus: data.order.paymentStatus,
        trackingNumber: data.order.trackingNumber || "",
      })
    } catch (error) {
      toast.error("Error al cargar pedido")
      router.push("/admin/orders")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formData.status,
          paymentStatus: formData.paymentStatus,
          trackingNumber: formData.trackingNumber || null,
        }),
      })

      if (!res.ok) throw new Error("Error al actualizar")

      toast.success("Pedido actualizado")
      fetchOrder()
    } catch (error) {
      toast.error("Error al actualizar pedido")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!order) return null

  const shipping = order.shippingAddress as Order["shippingAddress"]

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/orders")}>
          <IconArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedido #{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge className={statusColors[order.status]}>
            {statusLabels[order.status]}
          </Badge>
          <Badge className={paymentStatusColors[order.paymentStatus]}>
            {paymentStatusLabels[order.paymentStatus]}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border rounded">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.product.images?.[0] || "/placeholder.jpg"}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/admin/products/${item.product.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {Number(item.price).toFixed(2)} €
                      </p>
                    </div>
                    <div className="font-medium">
                      {(item.quantity * Number(item.price)).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{Number(order.subtotal).toFixed(2)} €</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{Number(order.discount).toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{Number(order.total).toFixed(2)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Form */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Actualizar Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Estado</label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pendiente</SelectItem>
                        <SelectItem value="PROCESSING">Procesando</SelectItem>
                        <SelectItem value="SHIPPED">Enviado</SelectItem>
                        <SelectItem value="DELIVERED">Entregado</SelectItem>
                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Estado de Pago</label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(v) => setFormData({ ...formData, paymentStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pendiente</SelectItem>
                        <SelectItem value="PAID">Pagado</SelectItem>
                        <SelectItem value="FAILED">Fallido</SelectItem>
                        <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Numero de Seguimiento</label>
                  <Input
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    placeholder="Numero de tracking"
                  />
                </div>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {order.user ? (
                <div className="space-y-2">
                  <p className="font-medium">{order.user.name || "Sin nombre"}</p>
                  <p className="text-sm text-muted-foreground">{order.user.email}</p>
                  {order.user.subscriptionPlan && (
                    <Badge variant="outline">
                      {order.user.subscriptionPlan.name}
                    </Badge>
                  )}
                  <Link
                    href={`/admin/users/${order.user.id}`}
                    className="block text-sm text-primary hover:underline mt-2"
                  >
                    Ver perfil del cliente
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">{order.guestName || "Sin nombre"}</p>
                  <p className="text-sm text-muted-foreground">{order.guestEmail}</p>
                  <Badge variant="outline">Invitado</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Direccion de Envio</CardTitle>
            </CardHeader>
            <CardContent>
              {shipping ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {shipping.firstName} {shipping.lastName}
                  </p>
                  <p>{shipping.address}</p>
                  <p>
                    {shipping.postalCode} {shipping.city}
                  </p>
                  <p>{shipping.country}</p>
                  {shipping.phone && <p className="text-muted-foreground">{shipping.phone}</p>}
                  {shipping.email && <p className="text-muted-foreground">{shipping.email}</p>}
                </div>
              ) : (
                <p className="text-muted-foreground">Sin direccion de envio</p>
              )}
            </CardContent>
          </Card>

          {/* Packlink PRO (solo si el pedido tiene dirección de envío) */}
          {shipping && <PacklinkPanel orderId={order.id} />}

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metodo</span>
                  <span>{order.paymentGateway || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge className={paymentStatusColors[order.paymentStatus]}>
                    {paymentStatusLabels[order.paymentStatus]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
