"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBell,
  IconShoppingCart,
  IconCreditCard,
  IconCreditCardOff,
  IconUserPlus,
  IconMessage,
  IconStar,
  IconCrown,
  IconCrownOff,
  IconMessageCircle,
  IconInfoCircle,
  IconBox,
  IconBoxOff,
  IconCheck,
  IconTrash,
  IconLoader2,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type AdminNotificationType =
  | "NEW_ORDER"
  | "ORDER_PAID"
  | "PAYMENT_FAILED"
  | "NEW_USER"
  | "NEW_CONTACT_MESSAGE"
  | "NEW_CASTING"
  | "NEW_SUBSCRIPTION"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_RENEWAL_REMINDER"
  | "SUBSCRIPTION_EXPIRED"
  | "NEW_FORUM_POST"
  | "LOW_STOCK"
  | "SYSTEM"

interface AdminNotification {
  id: string
  type: AdminNotificationType
  title: string
  message: string | null
  relatedUrl: string | null
  read: boolean
  createdAt: string
}

const iconByType: Record<AdminNotificationType, React.ComponentType<{ className?: string }>> = {
  NEW_ORDER: IconShoppingCart,
  ORDER_PAID: IconCreditCard,
  PAYMENT_FAILED: IconCreditCardOff,
  NEW_USER: IconUserPlus,
  NEW_CONTACT_MESSAGE: IconMessage,
  NEW_CASTING: IconStar,
  NEW_SUBSCRIPTION: IconCrown,
  SUBSCRIPTION_CANCELLED: IconCrownOff,
  SUBSCRIPTION_RENEWAL_REMINDER: IconCrown,
  SUBSCRIPTION_EXPIRED: IconCrownOff,
  NEW_FORUM_POST: IconMessageCircle,
  LOW_STOCK: IconBox,
  SYSTEM: IconInfoCircle,
}

const labelByType: Record<AdminNotificationType, string> = {
  NEW_ORDER: "Pedidos",
  ORDER_PAID: "Pedidos",
  PAYMENT_FAILED: "Pedidos",
  NEW_USER: "Usuarios",
  NEW_CONTACT_MESSAGE: "Contacto",
  NEW_CASTING: "Casting",
  NEW_SUBSCRIPTION: "Suscripciones",
  SUBSCRIPTION_CANCELLED: "Suscripciones",
  SUBSCRIPTION_RENEWAL_REMINDER: "Suscripciones",
  SUBSCRIPTION_EXPIRED: "Suscripciones",
  NEW_FORUM_POST: "Foro",
  LOW_STOCK: "Stock",
  SYSTEM: "Sistema",
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [marking, setMarking] = React.useState(false)
  const [filter, setFilter] = React.useState<"all" | "unread">("all")

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/notifications?limit=50&unreadOnly=${filter === "unread"}`)
      if (!res.ok) throw new Error("Error al cargar notificaciones")
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      toast.error("Error al cargar notificaciones")
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  React.useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function markAllRead() {
    setMarking(true)
    try {
      const res = await fetch("/api/admin/notifications/mark-all-read", { method: "POST" })
      if (!res.ok) throw new Error()
      await fetchNotifications()
      toast.success("Todas marcadas como leídas")
    } catch {
      toast.error("Error al marcar como leídas")
    } finally {
      setMarking(false)
    }
  }

  async function markOneRead(id: string) {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: "PATCH" })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // silent
    }
  }

  async function deleteOne(id: string) {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast.success("Notificación eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <IconBell className="size-6" /> Notificaciones
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} sin leer` : "Todas al día"}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-md border p-0.5">
            <Button
              size="sm"
              variant={filter === "all" ? "secondary" : "ghost"}
              onClick={() => setFilter("all")}
              className="h-8"
            >
              Todas
            </Button>
            <Button
              size="sm"
              variant={filter === "unread" ? "secondary" : "ghost"}
              onClick={() => setFilter("unread")}
              className="h-8"
            >
              Sin leer
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllRead} disabled={marking} variant="outline" size="sm">
              {marking ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <IconCheck className="mr-2 size-4" />
              )}
              Marcar todas
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border divide-y">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <IconBell className="size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {filter === "unread" ? "No hay notificaciones sin leer" : "No hay notificaciones"}
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = iconByType[n.type] ?? IconInfoCircle
            return (
              <div
                key={n.id}
                className={`flex gap-4 px-4 py-3 hover:bg-muted/50 transition-colors ${
                  !n.read ? "bg-muted/30" : ""
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{n.title}</span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {labelByType[n.type]}
                        </Badge>
                        {!n.read && (
                          <span className="size-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      {n.message && (
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {n.relatedUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      onClick={() => !n.read && markOneRead(n.id)}
                    >
                      <Link href={n.relatedUrl}>Ver</Link>
                    </Button>
                  )}
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markOneRead(n.id)}
                      aria-label="Marcar como leída"
                      title="Marcar como leída"
                      className="h-8 w-8"
                    >
                      <IconCheck className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteOne(n.id)}
                    aria-label="Eliminar"
                    title="Eliminar"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
