export type AdminRole =
  | "GLOBAL_ADMIN"
  | "CONTENT_EDITOR"
  | "ECOMMERCE_MANAGER"
  | "FINANCE_MANAGER"
  | "COMMUNITY_MODERATOR"

export type Permission =
  | "dashboard"
  | "videos"
  | "performers"
  | "video_categories"
  | "tags"
  | "blog"
  | "home_sections"
  | "pages"
  | "menus"
  | "products"
  | "shop_categories"
  | "attributes"
  | "shipping"
  | "orders"
  | "users"
  | "forum"
  | "reports"
  | "casting"
  | "subscriptions"
  | "promo_codes"
  | "referrals"
  | "settings"

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  GLOBAL_ADMIN: [], // Acceso total - se maneja con check especial
  CONTENT_EDITOR: [
    "dashboard",
    "videos",
    "performers",
    "video_categories",
    "tags",
    "blog",
    "home_sections",
    "pages",
    "menus",
  ],
  ECOMMERCE_MANAGER: ["dashboard", "products", "shop_categories", "attributes", "shipping", "orders"],
  FINANCE_MANAGER: [
    "dashboard",
    "subscriptions",
    "promo_codes",
    "referrals",
    "orders", // solo lectura
  ],
  COMMUNITY_MODERATOR: ["dashboard", "users", "forum", "reports", "casting"],
}

export function hasPermission(
  role: AdminRole | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false
  if (role === "GLOBAL_ADMIN") return true
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function getPermissionsForRole(role: AdminRole): Permission[] {
  if (role === "GLOBAL_ADMIN") {
    return [
      "dashboard",
      "videos",
      "performers",
      "video_categories",
      "tags",
      "blog",
      "home_sections",
      "pages",
      "menus",
      "products",
      "shop_categories",
      "attributes",
      "shipping",
      "orders",
      "users",
      "forum",
      "reports",
      "casting",
      "subscriptions",
      "promo_codes",
      "referrals",
      "settings",
    ]
  }
  return ROLE_PERMISSIONS[role] ?? []
}

// Mapeo de rutas a permisos
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/admin/videos": "videos",
  "/admin/actrices": "performers",
  "/admin/video-categories": "video_categories",
  "/admin/tags": "tags",
  "/admin/blog": "blog",
  "/admin/home": "home_sections",
  "/admin/pages": "pages",
  "/admin/menus": "menus",
  "/admin/products": "products",
  "/admin/shop-categories": "shop_categories",
  "/admin/attributes": "attributes",
  "/admin/shipping": "shipping",
  "/admin/orders": "orders",
  "/admin/users": "users",
  "/admin/forum": "forum",
  "/admin/reports": "reports",
  "/admin/casting": "casting",
  "/admin/subscriptions": "subscriptions",
  "/admin/promo-codes": "promo_codes",
  "/admin/referidos": "referrals",
  "/admin/settings": "settings",
}

export function canAccessRoute(
  role: AdminRole | null | undefined,
  pathname: string
): boolean {
  // Dashboard siempre accesible para admins
  if (pathname === "/admin") return true

  // Buscar ruta que coincida
  const matchingRoute = Object.keys(ROUTE_PERMISSIONS).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (!matchingRoute) return true // Ruta no protegida específicamente

  return hasPermission(role, ROUTE_PERMISSIONS[matchingRoute])
}
