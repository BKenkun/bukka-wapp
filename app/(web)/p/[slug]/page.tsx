import { notFound } from "next/navigation"
import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { CmsContent } from "@/components/cms-content"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPage(slug: string) {
  try {
    const page = await prisma.page.findUnique({
      where: {
        slug,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
        updatedAt: true,
      },
    })

    return page
  } catch (error) {
    console.error("Error fetching page:", error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    return {
      title: "Página no encontrada",
    }
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
  }
}

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-black text-white pt-[124px]">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <article className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1
              className="text-white font-black text-3xl md:text-4xl lg:text-5xl mb-4"
              style={{
                fontFamily: "Montserrat",
                fontWeight: 900,
                lineHeight: 1.2,
              }}
            >
              {page.title}
            </h1>
            <div
              className="text-white/60 text-sm"
              style={{
                fontFamily: "Montserrat",
                fontWeight: 500,
              }}
            >
              Última actualización: {new Date(page.updatedAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </header>

          <CmsContent content={page.content} />
        </article>
      </div>
    </main>
  )
}
