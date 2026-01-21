import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { EditPostForm } from "./edit-post-form"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarTemaPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  // Redirigir si no está autenticado
  if (!session?.user?.id) {
    redirect(`/admin/login?callbackUrl=/foro/${id}/editar`)
  }

  // Obtener el post
  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      ForumCategory: { select: { id: true, name: true } },
    },
  })

  if (!post) {
    notFound()
  }

  // Verificar que el usuario es el autor o es admin/moderador
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true, isModerator: true, SubscriptionPlan: { select: { level: true } } },
  })

  const isOwner = post.authorId === session.user.id
  const isAdminOrMod = user?.isAdmin || user?.isModerator

  if (!isOwner && !isAdminOrMod) {
    return (
      <div className="flex-1 flex flex-col font-sans bg-black text-white">
        <div className="px-4 md:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-montserrat text-white text-[30px] font-bold leading-[36px] mb-6">
              Acceso Denegado
            </h1>
            <p className="text-white/70 mb-8">
              No tienes permiso para editar este tema.
            </p>
            <Link
              href={`/foro/${id}`}
              className="inline-block bg-[#00B1DE] text-white px-8 py-3 font-montserrat font-medium"
            >
              Volver al Tema
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Si el tema está cerrado y no es admin, no puede editar
  if (post.isLocked && !isAdminOrMod) {
    return (
      <div className="flex-1 flex flex-col font-sans bg-black text-white">
        <div className="px-4 md:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-montserrat text-white text-[30px] font-bold leading-[36px] mb-6">
              Tema Cerrado
            </h1>
            <p className="text-white/70 mb-8">
              Este tema está cerrado y no se puede editar.
            </p>
            <Link
              href={`/foro/${id}`}
              className="inline-block bg-[#00B1DE] text-white px-8 py-3 font-montserrat font-medium"
            >
              Volver al Tema
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Obtener categorías disponibles para el usuario
  const userLevel = user?.SubscriptionPlan?.level ?? 0
  const categories = await prisma.forumCategory.findMany({
    where: {
      OR: [
        { minTierPlanId: null },
        {
          SubscriptionPlan: {
            level: { lte: userLevel },
          },
        },
      ],
    },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  })

  return (
    <div className="flex-1 flex flex-col font-sans bg-black text-white">
      <div className="px-4 md:px-8 pt-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href={`/foro/${id}`}
            className="text-white/60 hover:text-white transition-colors font-montserrat text-sm"
          >
            ← Volver al Tema
          </Link>
        </div>
        <h1 className="font-montserrat text-white text-[30px] font-bold leading-[36px]">
          Editar Tema
        </h1>
      </div>

      <div className="px-4 md:px-8 py-8">
        <div className="max-w-3xl">
          <EditPostForm
            postId={post.id}
            initialTitle={post.title}
            initialContent={post.content}
            initialCategoryId={post.categoryId}
            categories={categories}
          />
        </div>
      </div>
    </div>
  )
}
