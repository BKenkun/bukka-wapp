import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AccountNav } from "@/components/account-nav"
import Link from "next/link"
import Image from "next/image"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const notifications = await prisma.performerNotify.findMany({
    where: { userId: session.user.id },
    include: {
      performer: {
        select: {
          id: true,
          slug: true,
          name: true,
          profileImage: true,
          comingSoon: true,
          comingSoonDate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const waiting = notifications.filter(n => n.performer.comingSoon)
  const available = notifications.filter(n => !n.performer.comingSoon)

  return (
    <div className="flex-1 flex flex-col font-sans" style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}>
      <div className="flex flex-col flex-1 pt-8 pb-12">
        <AccountNav />

        <div className="mt-8 w-full">
          <h2 className="font-montserrat text-[22px] font-bold leading-[28px] mb-2" style={{ color: "var(--text-primary)" }}>
            My Notifications
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Performers you are subscribed to. You will be notified when they become available.
          </p>

          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4" style={{ color: "var(--text-muted)" }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>No notifications yet</p>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                Subscribe to upcoming performers by clicking &quot;Notify Me&quot; on their cards
              </p>
              <Link href="/performers" className="btn-primary inline-block">
                Browse Performers
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Waiting section */}
              {waiting.length > 0 && (
                <div>
                  <h3 className="font-montserrat text-[16px] font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Waiting ({waiting.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {waiting.map((n) => (
                      <div
                        key={n.id}
                        className="flex flex-col"
                        style={{ border: "1px solid var(--border-color)" }}
                      >
                        <div className="relative w-full aspect-[9/16] overflow-hidden">
                          <Image
                            src={n.performer.profileImage || "/placeholder.jpg"}
                            alt={n.performer.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-3 flex flex-col gap-2">
                          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                            {n.performer.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Coming soon
                            {n.performer.comingSoonDate && (
                              <> — {new Date(n.performer.comingSoonDate).toLocaleDateString("en-US", { dateStyle: "medium" })}</>
                            )}
                          </p>
                          <UnsubscribeButton performerId={n.performer.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available section */}
              {available.length > 0 && (
                <div>
                  <h3 className="font-montserrat text-[16px] font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Available ({available.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {available.map((n) => (
                      <Link
                        key={n.id}
                        href={`/performers/${n.performer.slug}`}
                        className="flex flex-col hover:opacity-80 transition-opacity"
                        style={{ border: "1px solid var(--border-color)" }}
                      >
                        <div className="relative w-full aspect-[9/16] overflow-hidden">
                          <Image
                            src={n.performer.profileImage || "/placeholder.jpg"}
                            alt={n.performer.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-3 flex flex-col gap-1">
                          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                            {n.performer.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--brand-color)" }}>
                            {n.notified ? `Notified ${n.notifiedAt ? new Date(n.notifiedAt).toLocaleDateString("en-US", { dateStyle: "medium" }) : ""}` : "Available now!"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function UnsubscribeButton({ performerId }: { performerId: string }) {
  return (
    <form
      action={async () => {
        "use server"
        const session = await auth()
        if (!session?.user?.id) return
        await prisma.performerNotify.deleteMany({
          where: { userId: session.user.id, performerId },
        })
      }}
    >
      <button
        type="submit"
        className="w-full text-xs px-3 py-2 transition-colors hover:opacity-80"
        style={{ backgroundColor: "var(--brand-color)", color: "#FFFFFF" }}
      >
        Unsubscribe
      </button>
    </form>
  )
}
