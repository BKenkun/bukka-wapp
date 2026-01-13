"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface SubscriptionPlan {
  id: string
  slug: string
  name: string
}

type AdminRole =
  | "GLOBAL_ADMIN"
  | "CONTENT_EDITOR"
  | "ECOMMERCE_MANAGER"
  | "FINANCE_MANAGER"
  | "COMMUNITY_MODERATOR"

const ADMIN_ROLES: { value: AdminRole; label: string; description: string }[] = [
  { value: "GLOBAL_ADMIN", label: "Admin Global", description: "Acceso completo a todas las secciones" },
  { value: "CONTENT_EDITOR", label: "Editor de Contenido", description: "Videos, Actrices, Blog, CMS" },
  { value: "ECOMMERCE_MANAGER", label: "Gestor E-commerce", description: "Productos, Categorías, Pedidos" },
  { value: "FINANCE_MANAGER", label: "Gestor Financiero", description: "Suscripciones, Códigos Promo" },
  { value: "COMMUNITY_MODERATOR", label: "Moderador", description: "Usuarios, Foro, Casting" },
]

interface User {
  id: string
  subscriptionPlanId: string | null
  subscriptionPlan: SubscriptionPlan | null
  subscriptionEnd: Date | null
  isAdmin: boolean
  adminRole: string | null
  isPerformer: boolean
  isModerator: boolean
}

interface UserSubscriptionFormProps {
  user: User
  plans: SubscriptionPlan[]
}

export function UserSubscriptionForm({ user, plans }: UserSubscriptionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [planId, setPlanId] = React.useState(user.subscriptionPlanId || "")
  const [subscriptionEnd, setSubscriptionEnd] = React.useState(
    user.subscriptionEnd
      ? new Date(user.subscriptionEnd).toISOString().split("T")[0]
      : ""
  )
  const [isAdmin, setIsAdmin] = React.useState(user.isAdmin)
  const [adminRole, setAdminRole] = React.useState<string>(user.adminRole || "GLOBAL_ADMIN")
  const [isPerformer, setIsPerformer] = React.useState(user.isPerformer)
  const [isModerator, setIsModerator] = React.useState(user.isModerator)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionPlanId: planId || null,
          subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : null,
          isAdmin,
          adminRole: isAdmin ? adminRole : null,
          isPerformer,
          isModerator,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar")
      }

      toast.success("Usuario actualizado correctamente")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar")
    } finally {
      setIsSubmitting(false)
    }
  }

  const extendSubscription = (days: number) => {
    const currentEnd = subscriptionEnd ? new Date(subscriptionEnd) : new Date()
    const newEnd = new Date(currentEnd)
    newEnd.setDate(newEnd.getDate() + days)
    setSubscriptionEnd(newEnd.toISOString().split("T")[0])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Plan de Suscripción</Label>
          <Select value={planId || "__none__"} onValueChange={(v) => setPlanId(v === "__none__" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin plan</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscriptionEnd">Fecha de Expiración</Label>
          <Input
            id="subscriptionEnd"
            type="date"
            value={subscriptionEnd}
            onChange={(e) => setSubscriptionEnd(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => extendSubscription(30)}>
          +30 días
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => extendSubscription(90)}>
          +90 días
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => extendSubscription(365)}>
          +1 año
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium">Roles y Permisos</h4>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isAdmin">Administrador</Label>
            <p className="text-xs text-muted-foreground">
              Acceso al panel de administración
            </p>
          </div>
          <Switch
            id="isAdmin"
            checked={isAdmin}
            onCheckedChange={setIsAdmin}
          />
        </div>

        {isAdmin && (
          <div className="ml-4 p-4 border rounded-lg bg-muted/30 space-y-3">
            <Label>Rol de Administrador</Label>
            <Select value={adminRole} onValueChange={setAdminRole}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span>{role.label}</span>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isPerformer">Actriz</Label>
            <p className="text-xs text-muted-foreground">
              Cuenta vinculada a un perfil de actriz
            </p>
          </div>
          <Switch
            id="isPerformer"
            checked={isPerformer}
            onCheckedChange={setIsPerformer}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isModerator">Moderador</Label>
            <p className="text-xs text-muted-foreground">
              Permisos de moderación en foro y comentarios
            </p>
          </div>
          <Switch
            id="isModerator"
            checked={isModerator}
            onCheckedChange={setIsModerator}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
        Guardar Cambios
      </Button>
    </form>
  )
}
