import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileTabs } from "./profile-tabs"

interface ForumProfilePageProps {
  params: Promise<{ slug: string }>
}

// Helper to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "a few seconds ago"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`
}

export async function generateMetadata({ params }: ForumProfilePageProps) {
  const { slug } = await params
  const user = await prisma.user.findUnique({
    where: { id: slug },
    select: { name: true },
  })

  if (!user) return { title: "User not found" }

  return {
    title: `${user.name || "User"} - Forum Profile`,
  }
}

export default async function ForumProfilePage({ params }: ForumProfilePageProps) {
  const { slug } = await params

  // Fetch user with their forum activity
  const user = await prisma.user.findUnique({
    where: { id: slug },
    select: {
      id: true,
      name: true,
      image: true,
      SubscriptionPlan: { select: { name: true } },
      createdAt: true,
      ForumPost: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          content: true,
          likeCount: true,
          replyCount: true,
          createdAt: true,
        },
      },
      ForumReply: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          content: true,
          createdAt: true,
          ForumPost: {
            select: { id: true, title: true },
          },
        },
      },
      _count: {
        select: {
          ForumPost: true,
          ForumReply: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  // Calculate stats
  const totalLikes = user.ForumPost.reduce((acc, post) => acc + post.likeCount, 0)
  const memberSince = user.createdAt

  // Get tier badge info
  const tierBadges: Record<string, { label: string; textColor: string; bgColor: string }> = {
    VISITOR: { label: "Visitor", textColor: "#6B7280", bgColor: "#E5E7EB" },
    FREE: { label: "Free", textColor: "#16A34A", bgColor: "#DCFCE7" },
    SILVER: { label: "Silver", textColor: "#6B7280", bgColor: "#E5E7EB" },
    GOLD: { label: "Gold", textColor: "#854D0E", bgColor: "#FEF9C3" },
    PLATINUM: { label: "Platinum", textColor: "#7C3AED", bgColor: "#EDE9FE" },
    DIAMOND: { label: "Diamond", textColor: "#1E40AF", bgColor: "#DBEAFE" },
  }

  const tierName = user.SubscriptionPlan?.name.toUpperCase() || "FREE"
  const tierBadge = tierBadges[tierName] || tierBadges.FREE

  // Calculate reputation (simple formula)
  const reputation = Math.min(100, Math.round(
    (user._count.ForumPost * 5 + user._count.ForumReply * 2 + totalLikes * 3) / 10
  ))

  return (
    <div className="flex-1 flex flex-col font-sans bg-black text-white">
      <div className="px-4 md:px-8 pt-8">
        <h1 className="font-montserrat text-white text-[30px] font-bold leading-[36px]">Forum</h1>
      </div>

      <div className="flex flex-1 px-4 md:px-8 py-12 gap-8">
        {/* Sidebar - Profile Card Only */}
        <div className="w-[320px] flex-shrink-0">
          <div className="border border-[#E5E7EB] overflow-hidden">
            {/* Gradient Header */}
            <div
              className="h-[100px] relative"
              style={{ background: "linear-gradient(90deg, #00B1DE 0%, #8B5CF6 100%)" }}
            >
              {/* Profile Image - positioned to overlap */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2">
                <div className="w-[100px] h-[100px] rounded-full overflow-hidden border-4 border-white bg-gray-600 relative">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || ""}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="pt-[60px] px-6 pb-6 flex flex-col items-center">
              {/* Username */}
              <h2 className="font-montserrat text-white text-[20px] font-bold leading-[28px] text-center mb-2">
                {user.name || "User"}
              </h2>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="font-montserrat text-[12px] font-medium px-3 py-1"
                  style={{ color: tierBadge.textColor, backgroundColor: tierBadge.bgColor }}
                >
                  {tierBadge.label}
                </span>
              </div>

              {/* Member since */}
              <p className="font-montserrat text-white/60 text-[14px] font-normal leading-[23px] text-center mb-4">
                Member since {new Date(memberSince).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 mb-6 w-full">
                <div className="text-center">
                  <span className="font-montserrat text-white text-[20px] font-bold leading-normal block">
                    {totalLikes}
                  </span>
                  <span className="font-montserrat text-white text-[12px] font-normal">Likes</span>
                </div>
                <div className="text-center">
                  <span className="font-montserrat text-white text-[20px] font-bold leading-normal block">
                    {user._count.ForumPost}
                  </span>
                  <span className="font-montserrat text-white text-[12px] font-normal">Topics</span>
                </div>
                <div className="text-center">
                  <span className="font-montserrat text-white text-[20px] font-bold leading-normal block">
                    {reputation}%
                  </span>
                  <span className="font-montserrat text-white text-[12px] font-normal">Reputation</span>
                </div>
              </div>

              {/* Back to Forum Button */}
              <Link href="/forum" className="w-full">
                <button className="w-full font-montserrat text-white text-[16px] font-normal text-center bg-[#00B1DE] flex items-center justify-center gap-2 py-[10px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back to Forum
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Activity Section */}
          <div className="p-6" style={{ background: "rgba(107, 114, 128, 0.38)" }}>
            <h2 className="font-montserrat text-white text-[18px] font-semibold leading-normal mb-6">
              Stats
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-black/20">
                <span className="font-montserrat text-[#FA4860] text-[24px] font-bold block">
                  {user._count.ForumPost}
                </span>
                <span className="font-montserrat text-white text-[14px]">Topics Created</span>
              </div>
              <div className="text-center p-4 bg-black/20">
                <span className="font-montserrat text-[#00B1DE] text-[24px] font-bold block">
                  {user._count.ForumReply}
                </span>
                <span className="font-montserrat text-white text-[14px]">Replies</span>
              </div>
              <div className="text-center p-4 bg-black/20">
                <span className="font-montserrat text-[#16A34A] text-[24px] font-bold block">
                  {totalLikes}
                </span>
                <span className="font-montserrat text-white text-[14px]">Likes Received</span>
              </div>
              <div className="text-center p-4 bg-black/20">
                <span className="font-montserrat text-[#8B5CF6] text-[24px] font-bold block">
                  {reputation}%
                </span>
                <span className="font-montserrat text-white text-[14px]">Reputation</span>
              </div>
            </div>
          </div>

          {/* Tabs and Content */}
          <ProfileTabs
            posts={user.ForumPost.map((post) => ({
              id: post.id,
              title: post.title,
              description: post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content,
              likes: post.likeCount,
              responses: post.replyCount,
              timeAgo: formatTimeAgo(post.createdAt),
            }))}
            replies={user.ForumReply.map((reply) => ({
              id: reply.id,
              postId: reply.ForumPost.id,
              postTitle: reply.ForumPost.title,
              content: reply.content.length > 150 ? reply.content.substring(0, 150) + "..." : reply.content,
              timeAgo: formatTimeAgo(reply.createdAt),
            }))}
          />
        </div>
      </div>
    </div>
  )
}
