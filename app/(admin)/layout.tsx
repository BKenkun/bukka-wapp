import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Verificar si es admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, adminRole: true, name: true, email: true, image: true },
  })

  if (!user?.isAdmin) {
    redirect("/")
  }

  const adminUser = {
    name: user.name || "Admin",
    email: user.email || "",
    avatar: user.image || "/avatars/admin.jpg",
    adminRole: user.adminRole,
  }

  return (
    <SidebarProvider
      className="text-foreground"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AdminSidebar variant="inset" user={adminUser} />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
