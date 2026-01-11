"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconLoader2, IconCheck, IconX, IconClock, IconEye } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface CastingSubmission {
  id: string
  status: string
  notes: string | null
}

interface CastingStatusFormProps {
  submission: CastingSubmission
}

export function CastingStatusForm({ submission }: CastingStatusFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [status, setStatus] = React.useState(submission.status)
  const [notes, setNotes] = React.useState(submission.notes || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/casting/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar")
      }

      toast.success("Solicitud actualizada")
      router.refresh()
    } catch (error) {
      toast.error("Error al actualizar la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickAction = async (newStatus: string) => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/casting/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar")
      }

      setStatus(newStatus)
      toast.success(`Solicitud ${newStatus === "ACCEPTED" ? "aceptada" : "rechazada"}`)
      router.refresh()
    } catch (error) {
      toast.error("Error al actualizar la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">
              <div className="flex items-center gap-2">
                <IconClock className="size-4 text-yellow-500" />
                Pendiente
              </div>
            </SelectItem>
            <SelectItem value="REVIEWING">
              <div className="flex items-center gap-2">
                <IconEye className="size-4 text-blue-500" />
                En revisión
              </div>
            </SelectItem>
            <SelectItem value="ACCEPTED">
              <div className="flex items-center gap-2">
                <IconCheck className="size-4 text-green-500" />
                Aceptada
              </div>
            </SelectItem>
            <SelectItem value="REJECTED">
              <div className="flex items-center gap-2">
                <IconX className="size-4 text-red-500" />
                Rechazada
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas internas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas sobre esta solicitud..."
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
        Guardar
      </Button>

      {status !== "ACCEPTED" && status !== "REJECTED" && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Acciones rápidas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-green-500 border-green-500/30 hover:bg-green-500/10"
              disabled={isSubmitting}
              onClick={() => quickAction("ACCEPTED")}
            >
              <IconCheck className="mr-2 size-4" />
              Aceptar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-500 border-red-500/30 hover:bg-red-500/10"
              disabled={isSubmitting}
              onClick={() => quickAction("REJECTED")}
            >
              <IconX className="mr-2 size-4" />
              Rechazar
            </Button>
          </div>
        </>
      )}
    </form>
  )
}
