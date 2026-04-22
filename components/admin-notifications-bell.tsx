"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  IconCheck,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "Ahora mismo"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Hace ${days} d`
  const months = Math.floor(days / 30)
  return `Hace ${months} meses`
}

export function AdminNotificationsBell() {
  const router = useRouter()
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const [marking, setMarking] = React.useState(false)

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=15")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // silent
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function markAllRead() {
    setMarking(true)
    try {
      await fetch("/api/admin/notifications/mark-all-read", { method: "POST" })
      await fetchNotifications()
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

  async function handleItemClick(n: AdminNotification, e: React.MouseEvent) {
    if (!n.read) {
      // No await: navegar ya, marcar en background
      markOneRead(n.id)
    }
    if (n.relatedUrl) {
      e.preventDefault()
      setOpen(false)
      router.push(n.relatedUrl)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground">
          <IconBell className="size-5 text-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 text-foreground p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="px-0">
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                {unreadCount} sin leer
              </span>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={marking}
              onClick={markAllRead}
              className="h-7 text-xs"
            >
              <IconCheck className="mr-1 size-3" />
              Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-[420px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay notificaciones
            </div>
          ) : (
            <>
            {notifications.map((n) => {
              const Icon = iconByType[n.type] ?? IconInfoCircle
              const content = (
                <div
                  className={`flex gap-3 px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors ${
                    !n.read ? "bg-muted/50" : ""
                  }`}
                  onClick={(e) => handleItemClick(n, e)}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-tight">{n.title}</p>
                      {!n.read && (
                        <span className="mt-1 size-2 flex-shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    {n.message && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {n.message}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              )
              return n.relatedUrl ? (
                <Link key={n.id} href={n.relatedUrl} className="block">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              )
            })}
            </>
          )}
        </div>

        <DropdownMenuSeparator />
        <Link
          href="/admin/notifications"
          onClick={() => setOpen(false)}
          className="block px-3 py-2 text-center text-sm text-primary hover:bg-muted transition-colors"
        >
          Ver todas las notificaciones
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
