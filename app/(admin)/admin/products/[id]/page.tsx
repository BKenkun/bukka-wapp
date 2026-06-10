import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductForm } from "../product-form"
import Link from "next/link"
import { IconArrowLeft, IconEye, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params

  const [productRaw, performers, categories, attributes] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        performers: {
          include: {
            performer: {
              select: { id: true, name: true, slug: true, profileImage: true },
            },
          },
        },
        ProductToCategory: {
          include: {
            ShopCategory: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        ProductTag: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            OrderItem: true,
            favorites: true,
          },
        },
      },
    }),
    prisma.performer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, profileImage: true },
    }),
    prisma.shopCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.attribute.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: { id: true, value: true, slug: true, colorHex: true },
        },
      },
    }),
  ])

  if (!productRaw) {
    notFound()
  }

  // Transformar para compatibilidad
  const product = {
    ...productRaw,
    performers: productRaw.performers.map((pp) => pp.performer),
    categories: productRaw.ProductToCategory.map((ptc) => ({
      category: ptc.ShopCategory,
    })),
    tags: productRaw.ProductTag.map((pt) => ({
      tag: pt.tag,
    })),
    _count: {
      orderItems: productRaw._count.OrderItem,
      favorites: productRaw._count.favorites,
    },
  }

  // Calculate total revenue
  const orderItems = await prisma.orderItem.findMany({
    where: { productId: id },
    select: { quantity: true, price: true },
  })

  const totalRevenue = orderItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  )

  const formattedProduct = {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    weight: product.weight ? Number(product.weight) : null,
    productType: product.productType || "SIMPLE",
    metadata: productRaw.metadata as Record<string, unknown> | null,
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <IconArrowLeft className="mr-2 size-4" />
              Volver a Productos
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/tienda/${product.slug}`} target="_blank">
                <IconEye className="mr-2 size-4" />
                Ver en tienda
              </Link>
            </Button>
            <Button variant="destructive" size="sm">
              <IconTrash className="mr-2 size-4" />
              Eliminar
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {product.images[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <div>
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{product.status}</Badge>
              <Badge
                variant="outline"
                className={
                  product.riskLevel === "HIGH_RISK"
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-green-500/20 text-green-400"
                }
              >
                {product.riskLevel.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{product._count.orderItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRevenue.toFixed(2)}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {product.trackInventory ? product.stock : "∞"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Favoritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{product._count.favorites}</p>
          </CardContent>
        </Card>
      </div>

      <ProductForm
        product={formattedProduct}
        performers={performers}
        categories={categories}
        attributes={attributes}
      />
    </div>
  )
}
