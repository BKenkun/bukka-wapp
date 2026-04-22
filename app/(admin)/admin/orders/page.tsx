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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  IconLoader2,
  IconEye,
  IconSearch,
  IconDotsVertical,
  IconArchive,
  IconArchiveOff,
  IconTrash,
  IconEdit,
} from "@tabler/icons-react"

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    slug: string
  }
}

type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "ARCHIVED"
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED"

interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: number
  discount: number
  total: number
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
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
  ARCHIVED: "bg-gray-500",
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  ARCHIVED: "Archivado",
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [paymentFilter, setPaymentFilter] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [statusDialog, setStatusDialog] = React.useState<{ order: Order; newStatus: OrderStatus } | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState<Order | null>(null)
  const [rowActionLoading, setRowActionLoading] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, paymentFilter])

  async function fetchOrders() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(paymentFilter && { paymentStatus: paymentFilter }),
        ...(search && { search }),
      })

      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCount(data.pagination?.totalCount || 0)
    } catch (error) {
      toast.error("Error al cargar pedidos")
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    setRowActionLoading(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Error al actualizar")
      toast.success(
        newStatus === "ARCHIVED"
          ? "Pedido archivado"
          : `Estado cambiado a ${statusLabels[newStatus] ?? newStatus}`
      )
      fetchOrders()
    } catch {
      toast.error("Error al actualizar pedido")
    } finally {
      setRowActionLoading(null)
    }
  }

  async function deleteOrder(orderId: string) {
    setRowActionLoading(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast.success("Pedido eliminado")
      fetchOrders()
    } catch {
      toast.error("Error al eliminar pedido")
    } finally {
      setRowActionLoading(null)
      setDeleteDialog(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground">{totalCount} pedidos en total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por numero, email..."
            className="w-64"
          />
          <Button type="submit" variant="secondary">
            <IconSearch className="size-4" />
          </Button>
        </form>

        <Select value={statusFilter || "__all__"} onValueChange={(v) => { setStatusFilter(v === "__all__" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Activos (sin archivados)</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="PROCESSING">Procesando</SelectItem>
            <SelectItem value="SHIPPED">Enviado</SelectItem>
            <SelectItem value="DELIVERED">Entregado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
            <SelectItem value="ARCHIVED">Archivados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter || "__all__"} onValueChange={(v) => { setPaymentFilter(v === "__all__" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="PAID">Pagado</SelectItem>
            <SelectItem value="FAILED">Fallido</SelectItem>
            <SelectItem value="REFUNDED">Reembolsado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Fecha</TableHead>
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
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hay pedidos
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {order.user?.name || order.guestName || "Sin nombre"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.user?.email || order.guestEmail}
                      </p>
                      {!order.user && (
                        <Badge variant="outline" className="mt-1 text-[10px] h-5">
                          Invitado
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell className="font-medium">{Number(order.total).toFixed(2)} €</TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={paymentStatusColors[order.paymentStatus]}>
                      {paymentStatusLabels[order.paymentStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={rowActionLoading === order.id}>
                          {rowActionLoading === order.id ? (
                            <IconLoader2 className="size-4 animate-spin" />
                          ) : (
                            <IconDotsVertical className="size-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <IconEye className="mr-2 size-4" />
                            Ver pedido
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setStatusDialog({ order, newStatus: order.status })}
                        >
                          <IconEdit className="mr-2 size-4" />
                          Cambiar estado
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {order.status === "ARCHIVED" ? (
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "PENDING")}>
                            <IconArchiveOff className="mr-2 size-4" />
                            Desarchivar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "ARCHIVED")}>
                            <IconArchive className="mr-2 size-4" />
                            Archivar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteDialog(order)}
                        >
                          <IconTrash className="mr-2 size-4" />
                          Eliminar pedido
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cambiar estado modal */}
      <Dialog open={!!statusDialog} onOpenChange={(open) => { if (!open) setStatusDialog(null) }}>
        <DialogContent className="text-foreground">
          <DialogHeader>
            <DialogTitle>
              Cambiar estado del pedido
              {statusDialog && <span className="ml-2 text-muted-foreground font-normal">#{statusDialog.order.orderNumber}</span>}
            </DialogTitle>
          </DialogHeader>
          {statusDialog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nuevo estado</label>
                <Select
                  value={statusDialog.newStatus}
                  onValueChange={(v) => setStatusDialog({ ...statusDialog, newStatus: v as OrderStatus })}
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
                    <SelectItem value="ARCHIVED">Archivado</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Al cambiar a Procesando/Enviado/Entregado/Cancelado se envía el email correspondiente al cliente.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>Cancelar</Button>
            <Button
              disabled={!statusDialog || rowActionLoading === statusDialog?.order.id || statusDialog.newStatus === statusDialog.order.status}
              onClick={async () => {
                if (!statusDialog) return
                await updateOrderStatus(statusDialog.order.id, statusDialog.newStatus)
                setStatusDialog(null)
              }}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar pedido - confirm */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
        <AlertDialogContent className="text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog && (
                <>
                  Se eliminará permanentemente el pedido <strong>#{deleteDialog.orderNumber}</strong> y todos sus items.
                  Esta acción no se puede deshacer. Si no quieres borrarlo del todo, usa &quot;Archivar&quot;.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDialog && deleteOrder(deleteDialog.id)}
            >
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
