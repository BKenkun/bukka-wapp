import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth.edge"
import { canAccessRoute, type AdminRole } from "@/lib/admin-permissions"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas (no requieren autenticación)
  const publicRoutes = ["/", "/login", "/register", "/videos", "/actrices", "/shop", "/news"]

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Rutas que requieren ser admin
  const isAdminRoute = pathname.startsWith("/admin")

  // Rutas que requieren autenticación (mi-cuenta)
  const isProtectedRoute = pathname.startsWith("/my-account")

  // Obtener sesión usando NextAuth
  const session = await auth()

  // Debug en desarrollo
  if (process.env.NODE_ENV === "development" && (isAdminRoute || isProtectedRoute)) {
    console.log(`[PROXY] ${pathname} - Session:`, session?.user?.email, "isAdmin:", session?.user?.isAdmin, "adminRole:", session?.user?.adminRole)
  }

  // Si es ruta admin (excepto /admin/login)
  if (isAdminRoute && pathname !== "/admin/login") {
    if (!session?.user) {
      // No autenticado -> admin login
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!session.user.isAdmin) {
      // Autenticado pero no es admin -> home
      console.log(`[PROXY] User ${session.user.email} tried to access admin without permission`)
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Verificar permisos por rol para la ruta específica
    const adminRole = session.user.adminRole as AdminRole | null
    if (!canAccessRoute(adminRole, pathname)) {
      console.log(`[PROXY] User ${session.user.email} with role ${adminRole} lacks permission for ${pathname}`)
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  // Si es ruta protegida (mi-cuenta) y no está autenticado -> home
  if (isProtectedRoute && !session?.user) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Si es admin y va a /admin/login, redirigir al dashboard
  if (session?.user?.isAdmin && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api).*)",
  ],
}
