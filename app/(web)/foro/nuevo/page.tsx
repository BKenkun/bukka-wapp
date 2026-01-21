import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { NewTopicForm } from "./new-topic-form"
import { ForumAccessDenied } from "../forum-access-denied"

export default async function NuevoTemaPage() {
  const session = await auth()

  // Redirigir si no está autenticado
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/foro/nuevo")
  }

  // Obtener usuario con su plan de suscripción
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { SubscriptionPlan: true },
  })

  const userLevel = user?.SubscriptionPlan?.level ?? 0
  const canAccessForum = user?.SubscriptionPlan?.canAccessForum ?? false

  // Si no tiene acceso al foro, mostrar mensaje
  if (!canAccessForum) {
    return (
      <ForumAccessDenied
        isLoggedIn={true}
        currentPlanName={user?.SubscriptionPlan?.name}
      />
    )
  }

  // Obtener categorías y estadísticas
  const [categories, allCategories, stats] = await Promise.all([
    prisma.forumCategory.findMany({
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
        description: true,
      },
    }),
    prisma.forumCategory.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { ForumPost: true } } },
    }),
    Promise.all([
      prisma.forumPost.count(),
      prisma.user.count({ where: { ForumPost: { some: {} } } }),
      prisma.forumPost.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]),
  ])

  const [totalTopics, activeUsers, newToday] = stats

  return (
    <div className="flex-1 flex flex-col font-sans bg-black text-white">
      <div className="px-4 md:px-8 pt-24 md:pt-28">
        <h1 className="font-montserrat text-white text-[24px] md:text-[30px] font-bold leading-[32px] md:leading-[36px]">Foro</h1>
      </div>

      <div className="flex flex-1 px-4 md:px-8 py-6 lg:py-12 gap-8">
        {/* Sidebar - Same as /foro */}
        <div className="w-[280px] flex-shrink-0 hidden lg:block">
          <Link href="/foro">
            <button className="w-full font-montserrat text-white/70 text-[14px] font-medium text-center border border-white/20 mb-6 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors py-3 cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver al Foro
            </button>
          </Link>

          <div className="border border-[#E5E7EB] p-6">
            <h2 className="font-montserrat text-white text-[18px] font-semibold leading-normal mb-6">Categorías</h2>
            <div className="flex flex-col gap-2">
              <Link
                href="/foro"
                className="flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-white/5"
              >
                <span className="font-montserrat text-white text-[16px] font-medium leading-[24px]">
                  Todos
                </span>
                <span
                  className="font-montserrat text-[#111827] text-[12px] font-normal bg-white px-2 py-1 flex items-center justify-end"
                  style={{ padding: "4px 8px" }}
                >
                  {totalTopics}
                </span>
              </Link>
              {allCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/foro?categoria=${category.slug}`}
                  className="flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-white/5"
                >
                  <span className="font-montserrat text-white text-[16px] font-medium leading-[24px]">
                    {category.name}
                  </span>
                  <span
                    className="font-montserrat text-[#111827] text-[12px] font-normal bg-white px-2 py-1 flex items-center justify-end"
                    style={{ padding: "4px 8px" }}
                  >
                    {category._count.ForumPost}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="border border-[#E5E7EB] p-6 mt-6">
            <h2 className="font-montserrat text-white text-[18px] font-semibold leading-normal mb-6">Estadísticas</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-white text-[16px] font-normal leading-[24px]">Total Temas</span>
                <span className="font-montserrat text-white text-[16px] font-semibold leading-[24px]">
                  {totalTopics.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-white text-[16px] font-normal leading-[24px]">
                  Usuarios Activos
                </span>
                <span className="font-montserrat text-white text-[16px] font-semibold leading-[24px]">
                  {activeUsers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-white text-[16px] font-normal leading-[24px]">Nuevos Hoy</span>
                <span className="font-montserrat text-white text-[16px] font-semibold leading-[24px]">{newToday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#00B1DE] flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="font-montserrat text-white text-[24px] font-bold leading-[32px]">
                    Crear Nuevo Tema
                  </h2>
                  <p className="font-montserrat text-white/50 text-[14px]">
                    Comparte tus ideas con la comunidad
                  </p>
                </div>
              </div>

              {/* Mobile back link */}
              <Link
                href="/foro"
                className="lg:hidden inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors font-montserrat text-sm mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Volver al Foro
              </Link>
            </div>

            {/* Form Card */}
            <div className="border border-[#333] bg-[#111]">
              <NewTopicForm categories={categories} userName={user?.name ?? "Usuario"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
