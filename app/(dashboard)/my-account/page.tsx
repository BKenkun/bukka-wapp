import { AccountNav } from "@/components/account-nav"
import { SectionHeader } from "@/components/section-header"
import { PlanCard } from "@/components/plan-card"
import { OrderCard } from "@/components/order-card"
import { InteractionCard } from "@/components/interaction-card"
import Image from "next/image"
import Link from "next/link"
import { EyeIcon } from "@/components/eye-icon"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="43" height="40" viewBox="0 0 43 40" fill="none">
    <path
      d="M18.8712 16.4098C18.8712 15.9229 19.0156 15.447 19.2861 15.0422C19.5565 14.6375 19.941 14.322 20.3907 14.1357C20.8405 13.9494 21.3354 13.9006 21.8129 13.9956C22.2904 14.0906 22.729 14.325 23.0732 14.6692C23.4174 15.0135 23.6519 15.4521 23.7469 15.9296C23.8418 16.407 23.7931 16.902 23.6068 17.3517C23.4205 17.8015 23.105 18.1859 22.7002 18.4564C22.2954 18.7269 21.8195 18.8712 21.3327 18.8712C20.6799 18.8712 20.0538 18.6119 19.5922 18.1503C19.1306 17.6887 18.8712 17.0626 18.8712 16.4098ZM12.3073 18.8712C12.7942 18.8712 13.2701 18.7269 13.6748 18.4564C14.0796 18.1859 14.3951 17.8015 14.5814 17.3517C14.7677 16.902 14.8165 16.407 14.7215 15.9296C14.6265 15.4521 14.3921 15.0135 14.0478 14.6692C13.7036 14.325 13.265 14.0906 12.7875 13.9956C12.3101 13.9006 11.8151 13.9494 11.3654 14.1357C10.9156 14.322 10.5312 14.6375 10.2607 15.0422C9.99022 15.447 9.84586 15.9229 9.84586 16.4098C9.84586 17.0626 10.1052 17.6887 10.5668 18.1503C11.0284 18.6119 11.6545 18.8712 12.3073 18.8712ZM30.3581 18.8712C30.8449 18.8712 31.3208 18.7269 31.7256 18.4564C32.1304 18.1859 32.4459 17.8015 32.6322 17.3517C32.8185 16.902 32.8672 16.407 32.7722 15.9296C32.6772 15.4521 32.4428 15.0135 32.0986 14.6692C31.7543 14.325 31.3157 14.0906 30.8383 13.9956C30.3608 13.9006 29.8659 13.9494 29.4161 14.1357C28.9663 14.322 28.5819 14.6375 28.3114 15.0422C28.041 15.447 27.8966 15.9229 27.8966 16.4098C27.8966 17.0626 28.1559 17.6887 28.6175 18.1503C29.0792 18.6119 29.7052 18.8712 30.3581 18.8712ZM42.6654 3.28195V29.5376C42.6654 30.408 42.3196 31.2428 41.7041 31.8583C41.0886 32.4738 40.2539 32.8195 39.3834 32.8195H26.9879L24.1818 37.7301C23.8947 38.2323 23.48 38.6497 22.9796 38.94C22.4793 39.2302 21.9111 39.3831 21.3327 39.3831C20.7542 39.3831 20.1861 39.2302 19.6857 38.94C19.1854 38.6497 18.7707 38.2323 18.4835 37.7301L15.6775 32.8195H3.28195C2.41152 32.8195 1.57675 32.4738 0.961261 31.8583C0.345776 31.2428 0 30.408 0 29.5376V3.28195C0 2.41152 0.345776 1.57675 0.961261 0.961262C1.57675 0.345776 2.41152 0 3.28195 0Z"
      fill="none"
      stroke="var(--accent-color)"
      strokeWidth="3"
    />
  </svg>
)

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="43" height="40" viewBox="0 0 43 40" fill="none">
    <path
      d="M38.7 0H4.3C1.9 0 0 1.9 0 4.3V28.6C0 31 1.9 32.9 4.3 32.9H12.9L21.5 40L30.1 32.9H38.7C41.1 32.9 43 31 43 28.6V4.3C43 1.9 41.1 0 38.7 0ZM12.9 17.1C11.3 17.1 10 15.8 10 14.3C10 12.7 11.3 11.4 12.9 11.4C14.4 11.4 15.7 12.7 15.7 14.3C15.7 15.8 14.4 17.1 12.9 17.1ZM21.5 17.1C19.9 17.1 18.6 15.8 18.6 14.3C18.6 12.7 19.9 11.4 21.5 11.4C23 11.4 24.3 12.7 24.3 14.3C24.3 15.8 23 17.1 21.5 17.1ZM30.1 17.1C28.5 17.1 27.2 15.8 27.2 14.3C27.2 12.7 28.5 11.4 30.1 11.4C31.6 11.4 32.9 12.7 32.9 14.3C32.9 15.8 31.6 17.1 30.1 17.1Z"
      fill="var(--accent-color)"
    />
  </svg>
)

function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED",
  }
  return statusMap[status] || status
}

export default async function MiCuentaPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch user data with stats
  const [user, watchHistoryCount, performersViewed, unreadMessages, recentOrders, interactions, upgradePlans, recentVideos] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        SubscriptionPlan: true,
      },
    }),
    // Videos watched count
    prisma.watchHistory.count({
      where: { userId: session.user.id },
    }),
    // Unique performers viewed
    prisma.watchHistory.findMany({
      where: { userId: session.user.id },
      select: {
        video: {
          select: {
            performers: {
              select: { performerId: true },
            },
          },
        },
      },
    }),
    // Unread messages (direct messages)
    prisma.directMessage.count({
      where: {
        receiverId: session.user.id,
        isRead: false,
      },
    }),
    // Recent orders
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        OrderItem: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    // Interactions - forum posts with replies, forum posts, forum replies
    Promise.all([
      // Forum posts that have received replies
      prisma.forumPost.count({
        where: {
          authorId: session.user.id,
          replyCount: { gt: 0 },
        },
      }),
      prisma.forumPost.count({
        where: { authorId: session.user.id },
      }),
      prisma.forumReply.count({
        where: { authorId: session.user.id },
      }),
    ]),
    // Upgrade plans (only plans with higher level than current)
    (async () => {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { SubscriptionPlan: true },
      })
      const currentLevel = currentUser?.SubscriptionPlan?.level ?? 0

      return prisma.subscriptionPlan.findMany({
        where: {
          isActive: true,
          level: { gt: currentLevel },
          isFree: false,
        },
        orderBy: { level: "asc" },
        take: 2, // Show only next 2 plans
      })
    })(),
    // Recent watch history with videos
    prisma.watchHistory.findMany({
      where: { userId: session.user.id },
      include: {
        video: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
            performers: {
              include: {
                performer: {
                  select: { name: true },
                },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { lastWatchedAt: "desc" },
      take: 6,
    }),
  ])

  if (!user) {
    redirect("/login")
  }

  // Calculate unique performers viewed
  const uniquePerformers = new Set(
    performersViewed.flatMap((h) => h.video.performers.map((p) => p.performerId))
  )

  const stats = [
    {
      id: 1,
      title: "Videos Watched",
      count: watchHistoryCount.toString().padStart(2, "0"),
    },
    {
      id: 2,
      title: "Performers Viewed",
      count: uniquePerformers.size.toString().padStart(2, "0"),
    },
    {
      id: 3,
      title: "Unread Messages",
      count: unreadMessages.toString().padStart(2, "0"),
    },
  ]

  const [postsWithReplies, forumPostsCount, forumRepliesCount] = interactions
  const totalForumActivity = forumPostsCount + forumRepliesCount

  const interactionStats = [
    {
      id: 1,
      title: "Topics Replied",
      count: postsWithReplies.toString().padStart(2, "0"),
      href: `/foro/perfil/${session.user.id}`,
    },
    {
      id: 2,
      title: "Forum Activity",
      count: totalForumActivity.toString().padStart(2, "0"),
      href: `/foro/perfil/${session.user.id}`,
    },
    {
      id: 3,
      title: "Unread DMs",
      count: unreadMessages.toString().padStart(2, "0"),
      href: undefined,
    },
  ]

  const transformedOrders = recentOrders.map((order) => ({
    id: order.id,
    imageSrc: order.OrderItem[0]?.product?.images[0] || "/placeholder.jpg",
    title: order.OrderItem[0]?.product?.name || "Product",
    price: `${Number(order.total).toFixed(2)}€`,
    status: formatOrderStatus(order.status),
  }))

  const transformedPlans = upgradePlans.map((plan) => {
    const rawFeatures = Array.isArray(plan.features) ? plan.features : []
    // Features can be either strings or objects with {text, included}
    const features = rawFeatures
      .filter((f: unknown) => {
        if (typeof f === 'object' && f !== null && 'included' in f) {
          return (f as { included: boolean }).included !== false
        }
        return true
      })
      .map((f: unknown) => {
        if (typeof f === 'string') return f
        if (typeof f === 'object' && f !== null && 'text' in f) {
          return (f as { text: string }).text
        }
        return String(f)
      })
    return {
      name: plan.name,
      slug: plan.slug,
      price: `${Number(plan.monthlyPrice).toFixed(2)} €`,
      features: features.slice(0, 5),
      buttonText: `JOIN ${plan.name.toUpperCase()}`,
    }
  })

  const transformedRecentVideos = recentVideos.map((h) => ({
    id: h.video.id,
    slug: h.video.slug,
    title: h.video.title,
    thumbnailUrl: h.video.thumbnailUrl,
    performerName: h.video.performers[0]?.performer?.name || "",
  }))

  const currentPlanName = user.SubscriptionPlan?.name || "Visitor"
  const isHighestPlan = user.SubscriptionPlan?.canAccessExclusive === true
  const isFreeOrNoplan = !user.SubscriptionPlan || user.SubscriptionPlan.isFree

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}>
      <main className="pt-8 pb-12 flex flex-col">
        {/* Welcome message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Hello, {user.name || "User"}
          </h1>
          <p style={{ color: "var(--text-muted)" }} className="text-sm">{user.email}</p>
        </div>

        <AccountNav />

        {/* Stats Section */}
        <div className="mt-8 flex flex-col lg:flex-row gap-[20px] items-stretch justify-center">
          {stats.map((stat) => (
            <InteractionCard
              key={stat.id}
              title={stat.title}
              count={stat.count}
              icon={stat.id === 3 ? <MessageIcon /> : <EyeIcon />}
            />
          ))}
        </div>

        {/* MIS PEDIDOS Section */}
        <div className="mt-12">
          <SectionHeader title="MY ORDERS" />

          <div className="mt-8 flex flex-col items-center gap-[5px]">
            {transformedOrders.length > 0 ? (
              transformedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  imageSrc={order.imageSrc}
                  title={order.title}
                  price={order.price}
                  status={order.status}
                />
              ))
            ) : (
              <p style={{ color: "var(--text-muted)" }}>No orders yet</p>
            )}
          </div>
        </div>

        {/* SUBSCRIPCION Section */}
        <div className="mt-12">
          <SectionHeader title="SUBSCRIPTION" />

          <div className="mt-8 flex flex-col items-center">
            {/* Current Plan Card */}
            <div className="w-full max-w-[961px] border border-[rgba(229,231,235,0.43)] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-[33px_25px] flex flex-col justify-center items-start gap-[5px]">
              <div className="flex items-center gap-4">
                <div
                  className="w-[60px] h-[60px] flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent-color)" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 className="font-montserrat text-[24px] font-bold leading-8" style={{ color: "var(--text-primary)" }}>
                  Plan {currentPlanName}
                </h3>
              </div>

              <div className="ml-[76px] flex items-center gap-2">
                <span className="bg-[var(--brand-color)] text-white text-[14px] font-medium px-3 py-1">
                  {user.subscriptionEnd && new Date(user.subscriptionEnd) > new Date()
                    ? "Active"
                    : isFreeOrNoplan
                    ? "Free"
                    : "Expired"}
                </span>
                {user.subscriptionEnd && new Date(user.subscriptionEnd) > new Date() && (
                  <span className="font-montserrat text-[14px] font-normal leading-5" style={{ color: "var(--text-muted)" }}>
                    * Auto-renews
                  </span>
                )}
              </div>
            </div>

            {/* Promotional Banner */}
            <div className="mt-[70px] w-full max-w-[961px] relative h-[300px]">
              <Image
                src="/images/banner.png"
                alt="Special Offer - 50% off Diamond Plan"
                fill
                className="object-cover"
              />
            </div>

            {/* Upgrade Plans */}
            <div className="mt-[70px] w-full max-w-[961px]">
              <h2 className="font-montserrat text-[22px] font-bold leading-[48px]" style={{ color: "var(--text-primary)" }}>
                {isHighestPlan ? "Your current plan" : "Upgrade your plan"}
              </h2>

              {isHighestPlan ? (
                <div className="mt-[30px] p-6 border border-cyan-500/30 bg-cyan-500/5 text-center">
                  <div className="flex justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                      <path d="M6 3h12l4 6-10 13L2 9z"/>
                      <path d="M11 3 8 9l4 13 4-13-3-6"/>
                      <path d="M2 9h20"/>
                    </svg>
                  </div>
                  <p className="text-cyan-400 font-bold text-lg">You have the highest plan!</p>
                  <p className="mt-2" style={{ color: "var(--text-muted)" }}>You have full access to all exclusive content.</p>
                </div>
              ) : transformedPlans.length > 0 ? (
                <>
                  <div className="mt-[30px] flex flex-col gap-[20px]">
                    {transformedPlans.map((plan) => (
                      <PlanCard
                        key={plan.slug}
                        name={plan.name}
                        price={plan.price}
                        features={plan.features}
                        buttonText={plan.buttonText}
                      />
                    ))}
                  </div>

                  <div className="mt-[35px] text-center">
                    <Link
                      href="/my-account/subscription"
                      className="text-[var(--accent-color)] font-montserrat text-[16.586px] font-bold leading-normal uppercase hover:underline"
                    >
                      View all plans
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* INTERACCIONES Section */}
        <div className="mt-12">
          <SectionHeader title="INTERACTIONS" />

          <div className="mt-8 flex flex-col lg:flex-row gap-[20px] items-stretch justify-center">
            {interactionStats.map((interaction) => (
              <InteractionCard
                key={interaction.id}
                title={interaction.title}
                count={interaction.count}
                icon={<ChatIcon />}
                href={interaction.href}
              />
            ))}
          </div>
        </div>

        {/* ULTIMOS VIDEOS Section */}
        <div className="mt-12 mb-[50px]">
          <SectionHeader title="RECENT VIDEOS" />

          {transformedRecentVideos.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {transformedRecentVideos.map((video) => (
                <Link key={video.id} href={`/videos/${video.slug}`} className="group">
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={video.thumbnailUrl || "/placeholder.jpg"}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="mt-2 text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{video.title}</h4>
                  {video.performerName && (
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{video.performerName}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center" style={{ color: "var(--text-muted)" }}>
              You haven't watched any videos yet. <Link href="/videos" className="text-[var(--accent-color)] hover:underline">Browse videos</Link>
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
