import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { castingApiSchema } from "@/lib/validations/casting"
import { sendTemplateEmail, CastingReceivedTemplate } from "@/lib/email"
import { createAdminNotification } from "@/lib/admin-notifications"

// GET - Obtener todas las solicitudes de casting (admin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where = status && status !== "all"
      ? { status: status as "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED" }
      : {}

    const [submissions, total] = await Promise.all([
      prisma.castingSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.castingSubmission.count({ where }),
    ])

    return NextResponse.json({
      submissions,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching casting submissions:", error)
    return NextResponse.json(
      { error: "Error fetching applications" },
      { status: 500 }
    )
  }
}

// POST - Crear nueva solicitud de casting (público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validación con Zod
    const result = castingApiSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          details: result.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const {
      name,
      email,
      phone,
      birthDate,
      city,
      country,
      gender,
      height,
      weight,
      bust,
      waist,
      hips,
      hairColor,
      eyeColor,
      skinTone,
      tattoos,
      experience,
      additionalInfo,
      instagram,
      twitter,
      dniPhotoUrl,
      dniBackUrl,
      generalPhotos,
      videoUrl,
      identityVerified,
      identitySimilarity,
    } = result.data

    // Verificar si ya existe una solicitud con este email
    const existingSubmission = await prisma.castingSubmission.findFirst({
      where: {
        email,
        status: { in: ["PENDING", "REVIEWING"] },
      },
    })

    if (existingSubmission) {
      return NextResponse.json(
        { error: "You already have an application in progress" },
        { status: 400 }
      )
    }

    const submission = await prisma.castingSubmission.create({
      data: {
        name,
        email,
        phone,
        birthDate: new Date(birthDate),
        city,
        country,
        gender,
        height: height ? parseInt(height) : null,
        weight,
        bust,
        waist,
        hips,
        hairColor,
        eyeColor,
        skinTone,
        tattoos,
        experience,
        additionalInfo,
        instagram,
        twitter,
        dniPhotoUrl,
        dniBackUrl,
        generalPhotos: generalPhotos || [],
        videoUrl,
        identityVerified: identityVerified ?? false,
        identitySimilarity: identitySimilarity ?? null,
        status: "PENDING",
      },
    })

    // Send confirmation email
    await sendTemplateEmail({
      to: email,
      template: "casting/received",
      react: CastingReceivedTemplate({
        applicantName: name,
        submissionId: submission.id,
        submittedAt: submission.createdAt,
      }),
      metadata: { submissionId: submission.id },
    })

    await createAdminNotification({
      type: "NEW_CASTING",
      title: "Nueva solicitud de casting",
      message: `${submission.name} (${submission.email})`,
      relatedUrl: `/admin/casting/${submission.id}`,
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error("Error creating casting submission:", error)
    return NextResponse.json(
      { error: "Error creating application" },
      { status: 500 }
    )
  }
}
