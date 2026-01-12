import { prisma } from "@/lib/prisma"
import { VideoForm } from "../video-form"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export default async function NewVideoPage() {
  const [performers, categories, products, subscriptionPlans] = await Promise.all([
    prisma.performer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.videoCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, price: true, images: true },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
      select: { id: true, name: true, slug: true, level: true },
    }),
  ])

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/videos">
            <IconArrowLeft className="mr-2 size-4" />
            Volver a Videos
          </Link>
        </Button>
      </div>

      <VideoForm
        performers={performers}
        categories={categories}
        products={products.map(p => ({ ...p, price: Number(p.price) }))}
        subscriptionPlans={subscriptionPlans}
      />
    </div>
  )
}
