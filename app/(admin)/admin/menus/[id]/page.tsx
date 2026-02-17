import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { MenuEditor } from "./menu-editor"
import type { MegamenuLink } from "@/types/megamenu"

interface Props {
  params: Promise<{ id: string }>
}

// Menús predefinidos del sistema
const SYSTEM_MENUS: Record<string, { name: string; description: string; defaultTitle?: string }> = {
  "topbar": {
    name: "Top Bar",
    description: "Enlaces con iconos en la barra superior (BUKAKERY, GANGLORY, etc.)",
  },
  "header-main": {
    name: "Menú Principal (Header)",
    description: "Enlaces principales de navegación en el header",
  },
  "header-user": {
    name: "Menú Usuario (Header)",
    description: "Enlaces del menú de usuario logueado",
  },
  "header-guest": {
    name: "Menú Invitado (Header)",
    description: "Dropdown que aparece al pasar el ratón sobre el icono de usuario cuando no está logueado",
  },
  "footer-col-1": {
    name: "Footer - Columna 1 (Servicios)",
    description: "Enlaces de servicios: Cursos, Tienda, Blog, etc.",
    defaultTitle: "SERVICIOS",
  },
  "footer-col-2": {
    name: "Footer - Columna 2 (Contacto)",
    description: "Enlaces de contacto y soporte",
    defaultTitle: "CONTACTO",
  },
  "footer-col-3": {
    name: "Footer - Columna 3 (Información)",
    description: "Enlaces informativos: Términos, Privacidad, etc.",
    defaultTitle: "INFORMACIÓN",
  },
  "footer-col-4": {
    name: "Footer - Columna 4 (Facturación)",
    description: "Enlaces de facturación y proveedores de pago",
    defaultTitle: "FACTURACIÓN",
  },
}

export default async function EditMenuPage({ params }: Props) {
  const { id: slug } = await params

  // Obtener el menú si existe
  let menu = await prisma.menu.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          megamenuConfig: true,
        },
      },
    },
  })

  // Obtener páginas para el selector
  const pages = await prisma.page.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, slug: true },
    orderBy: { title: "asc" },
  })

  // Obtener planes de suscripción para el selector de nivel mínimo
  const subscriptionPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    select: { id: true, name: true, level: true, slug: true },
    orderBy: { level: "asc" },
  })

  // Obtener performers para el selector de megamenu
  const performers = await prisma.performer.findMany({
    select: { id: true, name: true, slug: true, profileImage: true },
    orderBy: { name: "asc" },
  })

  // Obtener categorías de video para el selector de megamenu
  const videoCategories = await prisma.videoCategory.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  })

  // Obtener productos para el selector de megamenu
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, slug: true, images: true },
    orderBy: { name: "asc" },
  })

  // Transform menu to properly type megamenuConfig.links
  const transformedMenu = menu ? {
    ...menu,
    items: menu.items.map(item => ({
      ...item,
      megamenuConfig: item.megamenuConfig ? {
        ...item.megamenuConfig,
        links: (item.megamenuConfig.links as unknown as MegamenuLink[]) || [],
      } : null,
    })),
  } : null

  // Info del menú del sistema
  const menuInfo = SYSTEM_MENUS[slug]

  if (!menuInfo) {
    return (
      <div className="px-4 lg:px-6">
        <h2 className="text-lg font-semibold">Menú no encontrado</h2>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/menus">
            <IconArrowLeft className="mr-2 size-4" />
            Volver a Menús
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">{menuInfo.name}</h2>
        <p className="text-sm text-muted-foreground">
          {menuInfo.description}
        </p>
      </div>

      <MenuEditor
        menuSlug={slug}
        menuName={menuInfo.name}
        defaultTitle={menuInfo.defaultTitle}
        existingMenu={transformedMenu}
        pages={pages}
        subscriptionPlans={subscriptionPlans}
        performers={performers}
        products={products}
        videoCategories={videoCategories}
      />
    </div>
  )
}
