import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import {
  sendTemplateEmail,
  CastingReviewingTemplate,
  CastingAcceptedTemplate,
  CastingRejectedTemplate,
} from "@/lib/email"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Obtener una solicitud de casting (admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { id } = await params

    const submission = await prisma.castingSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error fetching casting submission:", error)
    return NextResponse.json(
      { error: "Error fetching application" },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado de una solicitud (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const existingSubmission = await prisma.castingSubmission.findUnique({
      where: { id },
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    const { status, notes } = body

    // Validar status
    const validStatuses = ["PENDING", "REVIEWING", "ACCEPTED", "REJECTED"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const previousStatus = existingSubmission.status

    const submission = await prisma.castingSubmission.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    })

    // Send email based on status change
    if (status && status !== previousStatus) {
      switch (status) {
        case "REVIEWING":
          await sendTemplateEmail({
            to: submission.email,
            template: "casting/reviewing",
            react: CastingReviewingTemplate({
              applicantName: submission.name,
              submissionId: submission.id,
            }),
            metadata: { submissionId: submission.id },
          })
          break

        case "ACCEPTED":
          await sendTemplateEmail({
            to: submission.email,
            template: "casting/accepted",
            react: CastingAcceptedTemplate({
              applicantName: submission.name,
              submissionId: submission.id,
              nextSteps: notes || undefined,
            }),
            metadata: { submissionId: submission.id },
          })
          break

        case "REJECTED":
          await sendTemplateEmail({
            to: submission.email,
            template: "casting/rejected",
            react: CastingRejectedTemplate({
              applicantName: submission.name,
              submissionId: submission.id,
              customMessage: notes || undefined,
            }),
            metadata: { submissionId: submission.id },
          })
          break
      }
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error updating casting submission:", error)
    return NextResponse.json(
      { error: "Error updating application" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una solicitud (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { id } = await params

    const existingSubmission = await prisma.castingSubmission.findUnique({
      where: { id },
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    await prisma.castingSubmission.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting casting submission:", error)
    return NextResponse.json(
      { error: "Error deleting application" },
      { status: 500 }
    )
  }
}
