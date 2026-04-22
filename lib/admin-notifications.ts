import { prisma } from "@/lib/prisma"
import type { AdminNotificationType } from "@prisma/client"

interface CreateAdminNotificationParams {
  type: AdminNotificationType
  title: string
  message?: string | null
  relatedUrl?: string | null
}

/**
 * Crea una notificación para el admin. Silencia errores para no romper el
 * flujo del caller (p.ej. si falla la creación de una notificación no
 * queremos que falle la creación del pedido).
 */
export async function createAdminNotification(
  params: CreateAdminNotificationParams
): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message ?? null,
        relatedUrl: params.relatedUrl ?? null,
      },
    })
  } catch (error) {
    console.error("Failed to create admin notification:", error)
  }
}
