import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendTemplateEmail, VerifyEmailTemplate } from "@/lib/email"
import { createAdminNotification } from "@/lib/admin-notifications"
import { z } from "zod"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    await createAdminNotification({
      type: "NEW_USER",
      title: "Nuevo usuario registrado",
      message: `${user.name || "Usuario"} (${user.email})`,
      relatedUrl: `/admin/users/${user.id}`,
    })

    // Generate email verification token
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Send verification email
    const verificationUrl = `${APP_URL}/api/auth/verify-email?token=${token}`

    await sendTemplateEmail({
      to: user.email,
      template: "auth/verify-email",
      react: VerifyEmailTemplate({
        name: user.name || "usuario",
        verificationUrl,
      }),
      metadata: { userId: user.id },
    })

    return NextResponse.json(
      {
        message: "Usuario creado correctamente. Por favor verifica tu email.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
