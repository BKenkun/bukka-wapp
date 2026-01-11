import { prisma } from "@/lib/prisma"
import { VideoForm } from "../video-form"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export default async function NewVideoPage() {
  const [performers, categories, subscriptionPlans] = await Promise.all([
    prisma.performer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.videoCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
      select: { id: true, name: true, slug: true, level: true, color: true },
    }),
  ])

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/videos">
            <IconArrowLeft className="mr-2 size-4" />
            Volver a Videos
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Nuevo Video</h2>
        <p className="text-sm text-muted-foreground">
          Crea un nuevo video para la plataforma
        </p>
      </div>

      <VideoForm performers={performers} categories={categories} subscriptionPlans={subscriptionPlans} />
    </div>
  )
}
