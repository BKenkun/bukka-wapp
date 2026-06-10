import { prisma } from "@/lib/prisma"
import { HomeSectionRenderer } from "@/components/home/home-section-renderer"

// Fallback sections if database is empty
import { Hero } from "@/components/hero"
import { SectionHeader } from "@/components/section-header"
import { VideoGrid } from "@/components/video-grid"
import { ActressesGrid } from "@/components/actresses-grid"
import { CountdownTimer } from "@/components/countdown-timer"

async function getHomeSections() {
  try {
    const sections = await prisma.homeSection.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    })
    return sections
  } catch (error) {
    console.error("Error fetching home sections:", error)
    return null
  }
}

export default async function Page() {
  const sections = await getHomeSections()

  // If no sections in DB, render the hardcoded fallback
  if (!sections || sections.length === 0) {
    return (
      <main className="min-h-screen flex flex-col gap-[5px] font-sans">
        <Hero />
        <SectionHeader title="LATEST VIDEOS ADDED" />
        <VideoGrid />
        <SectionHeader title="ACTRESSES" />
        <ActressesGrid />
        <SectionHeader title="LATEST POSTS" />
        <VideoGrid />
        <SectionHeader title="FEATURED CATEGORY" />
        <VideoGrid />
        <SectionHeader title="FEATURED CATEGORY" />
        <VideoGrid />
        <SectionHeader title="FEATURED CATEGORY" />
        <VideoGrid />
        <CountdownTimer />
      </main>
    )
  }

  // Render dynamic sections from database
  return (
    <main className="min-h-screen flex flex-col gap-[5px] font-sans">
      {sections.map((section) => (
        <HomeSectionRenderer
          key={section.id}
          section={{
            ...section,
            config: section.config as Record<string, unknown> | null,
          }}
        />
      ))}
    </main>
  )
}
