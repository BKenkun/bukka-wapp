import { notFound, redirect } from "next/navigation"
import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { CmsContent } from "@/components/cms-content"

const SLUG_REDIRECTS: Record<string, string> = {
  "terminos-servicio": "terms-of-service",
  "politica-privacidad": "privacy-policy",
  "confianza-seguridad": "trust-safety",
  "politica-eliminacion": "deletion-policy",
}

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
      title: "Page not found",
    }
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
  }
}

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params

  if (SLUG_REDIRECTS[slug]) {
    redirect(`/p/${SLUG_REDIRECTS[slug]}`)
  }

  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <article className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1
              className="font-black text-3xl md:text-4xl lg:text-5xl mb-4"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--global-font)",
                fontWeight: 900,
                lineHeight: 1.2,
              }}
            >
              {page.title}
            </h1>
            <div
              className="text-sm"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--global-font)",
                fontWeight: 500,
              }}
            >
              Last updated: {new Date(page.updatedAt).toLocaleDateString("en-US", {
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
