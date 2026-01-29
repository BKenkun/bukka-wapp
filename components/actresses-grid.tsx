import { ActressCard } from "@/components/actress-card"

interface Actress {
  id?: string
  slug?: string
  name: string
  imageUrl: string
  videoCount?: number
  totalViews?: number
  verified?: boolean
}

// Default sample data
const defaultActresses: Actress[] = Array(10).fill({
  name: "Lorem ipsum",
  imageUrl: "/woman-in-black-bikini-on-beach.jpg",
  verified: true,
})

interface ActressesGridProps {
  actresses?: Actress[]
  isFilterOpen?: boolean
}

export function ActressesGrid({ actresses = defaultActresses, isFilterOpen = false }: ActressesGridProps) {
  return (
    <section className="w-full">
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${isFilterOpen ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-[18px]`}
      >
        {actresses.map((actress, index) => (
          <div key={actress.id || index} className="w-full">
            <ActressCard
              name={actress.name}
              image={actress.imageUrl}
              slug={actress.slug}
              verified={actress.verified ?? true}
              viewMode="grid"
              videoCount={actress.videoCount}
              totalViews={actress.totalViews}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
