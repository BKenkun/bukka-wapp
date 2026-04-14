import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { NewTopicForm } from "./new-topic-form"
import { ForumAccessDenied } from "../forum-access-denied"

export default async function NuevoTemaPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/foro/nuevo")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { SubscriptionPlan: true },
  })

  const userLevel = user?.SubscriptionPlan?.level ?? 0
  const canAccessForum = user?.SubscriptionPlan?.canAccessForum ?? false

  if (!canAccessForum) {
    return (
      <ForumAccessDenied
        isLoggedIn={true}
        currentPlanName={user?.SubscriptionPlan?.name}
      />
    )
  }

  const [categories, allCategories, stats] = await Promise.all([
    prisma.forumCategory.findMany({
      where: {
        OR: [
          { minTierPlanId: null },
          { SubscriptionPlan: { level: { lte: userLevel } } },
        ],
      },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true, description: true },
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
    <div className="flex-1 flex flex-col font-sans" style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}>
      <div className="px-4 md:px-8 pt-24 md:pt-28">
        <h1 className="font-montserrat text-[24px] md:text-[30px] font-bold leading-[32px] md:leading-[36px]" style={{ color: "var(--text-primary)" }}>Forum</h1>
      </div>

      <div className="flex flex-1 px-4 md:px-8 py-6 lg:py-12 gap-8">
        {/* Sidebar */}
        <div className="w-[280px] flex-shrink-0 hidden lg:block">
          <Link href="/forum">
            <button className="w-full font-montserrat text-[14px] font-medium text-center mb-6 flex items-center justify-center gap-2 transition-colors py-3 cursor-pointer" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Forum
            </button>
          </Link>

          <div className="p-6" style={{ border: "1px solid var(--border-color)" }}>
            <h2 className="font-montserrat text-[18px] font-semibold leading-normal mb-6" style={{ color: "var(--text-primary)" }}>Categories</h2>
            <div className="flex flex-col gap-2">
              <Link href="/forum" className="flex items-center justify-between p-3 cursor-pointer transition-colors">
                <span className="font-montserrat text-[16px] font-medium leading-[24px]" style={{ color: "var(--text-primary)" }}>All</span>
                <span className="font-montserrat text-[12px] font-normal px-2 py-1" style={{ padding: "4px 8px", backgroundColor: "var(--brand-color)", color: "#FFFFFF" }}>{totalTopics}</span>
              </Link>
              {allCategories.map((category) => (
                <Link key={category.id} href={`/foro?categoria=${category.slug}`} className="flex items-center justify-between p-3 cursor-pointer transition-colors">
                  <span className="font-montserrat text-[16px] font-medium leading-[24px]" style={{ color: "var(--text-primary)" }}>{category.name}</span>
                  <span className="font-montserrat text-[12px] font-normal px-2 py-1" style={{ padding: "4px 8px", backgroundColor: "var(--brand-color)", color: "#FFFFFF" }}>{category._count.ForumPost}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-6 mt-6" style={{ border: "1px solid var(--border-color)" }}>
            <h2 className="font-montserrat text-[18px] font-semibold leading-normal mb-6" style={{ color: "var(--text-primary)" }}>Statistics</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-[16px] font-normal leading-[24px]" style={{ color: "var(--text-secondary)" }}>Total Topics</span>
                <span className="font-montserrat text-[16px] font-semibold leading-[24px]" style={{ color: "var(--text-primary)" }}>{totalTopics.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-[16px] font-normal leading-[24px]" style={{ color: "var(--text-secondary)" }}>Active Users</span>
                <span className="font-montserrat text-[16px] font-semibold leading-[24px]" style={{ color: "var(--text-primary)" }}>{activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-montserrat text-[16px] font-normal leading-[24px]" style={{ color: "var(--text-secondary)" }}>New Today</span>
                <span className="font-montserrat text-[16px] font-semibold leading-[24px]" style={{ color: "var(--text-primary)" }}>{newToday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 flex items-center justify-center" style={{ backgroundColor: "var(--accent-color)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="font-montserrat text-[24px] font-bold leading-[32px]" style={{ color: "var(--text-primary)" }}>Create New Topic</h2>
                  <p className="font-montserrat text-[14px]" style={{ color: "var(--text-muted)" }}>Share your ideas with the community</p>
                </div>
              </div>

              <Link href="/forum" className="lg:hidden inline-flex items-center gap-2 transition-colors font-montserrat text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Forum
              </Link>
            </div>

            <div style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--surface-bg)" }}>
              <NewTopicForm categories={categories} userName={user?.name ?? "User"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
