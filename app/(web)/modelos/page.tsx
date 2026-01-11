import { prisma } from "@/lib/prisma"
import { DiscountBanner } from "@/components/discount-banner"
import { ActressesGrid } from "@/components/actresses-grid"
import { CtaBanner } from "@/components/cta-banner"
import Link from "next/link"

interface SearchParams {
  page?: string
  sort?: string
}

export default async function ModelosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = 24
  const skip = (page - 1) * pageSize

  // Determinar ordenación
  const sortOption = params.sort || "popularity"
  let orderBy: any = { videoCount: "desc" } // Default: popularidad

  switch (sortOption) {
    case "newest":
      orderBy = { createdAt: "desc" }
      break
    case "oldest":
      orderBy = { createdAt: "asc" }
      break
    case "name":
      orderBy = { name: "asc" }
      break
    case "popularity":
    default:
      orderBy = { videoCount: "desc" }
  }

  const [performers, totalCount] = await Promise.all([
    prisma.performer.findMany({
      skip,
      take: pageSize,
      orderBy,
      select: {
        id: true,
        slug: true,
        name: true,
        profileImage: true,
        user: { select: { isVerified: true } },
        _count: { select: { videos: true } },
      },
    }),
    prisma.performer.count(),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Transformar datos para el grid
  const actresses = performers.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    imageUrl: p.profileImage || "/woman-in-black-bikini-on-beach.jpg",
    videoCount: p._count.videos,
    verified: p.user?.isVerified || false,
  }))

  return (
    <main className="flex-1 flex flex-col font-sans bg-black text-white">
      {/* Discount Banner */}
      <div>
        <DiscountBanner />
      </div>

      <div className="py-12 flex flex-col gap-12 flex-1 px-4 md:px-8">
        <div className="w-full">
          <div className="flex flex-col gap-4 mt-[25px]">
            {/* Title and count section */}
            <div className="flex flex-col gap-[10px]">
              <h1
                className="font-montserrat font-bold"
                style={{
                  color: "#E5E7EB",
                  fontSize: "30px",
                  lineHeight: "36px",
                }}
              >
                Actrices
              </h1>
              <p className="text-white font-montserrat text-base font-normal">
                Descubre talentosos intérpretes en nuestra base de medios
              </p>
              <p className="text-white font-montserrat text-sm font-normal">
                Mostrando {skip + 1}-{Math.min(skip + pageSize, totalCount)} de {totalCount.toLocaleString()} modelos
              </p>
            </div>

            <div className="flex justify-between items-center gap-4 flex-wrap">
              {/* Left side - filter buttons */}
              <div className="flex gap-2">
                <Link
                  href={`/modelos?sort=popularity&page=1`}
                  className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] ${
                    sortOption === "popularity" ? "bg-[#FA4860]" : "bg-[#00B1DE]"
                  }`}
                >
                  Popularidad
                </Link>
                <Link
                  href={`/modelos?sort=newest&page=1`}
                  className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] ${
                    sortOption === "newest" ? "bg-[#FA4860]" : "bg-[#00B1DE]"
                  }`}
                >
                  Más recientes
                </Link>
                <Link
                  href={`/modelos?sort=name&page=1`}
                  className={`text-white font-montserrat text-[14px] font-normal leading-[14px] px-[18px] py-[7px] ${
                    sortOption === "name" ? "bg-[#FA4860]" : "bg-[#00B1DE]"
                  }`}
                >
                  Nombre A-Z
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8">
            {actresses.length > 0 ? (
              <ActressesGrid actresses={actresses} isFilterOpen={false} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No hay actrices disponibles</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={`/modelos?sort=${sortOption}&page=${page - 1}`}
                  className="px-4 py-2 bg-[#00B1DE] text-white font-montserrat text-sm"
                >
                  Anterior
                </Link>
              )}

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  return (
                    <Link
                      key={pageNum}
                      href={`/modelos?sort=${sortOption}&page=${pageNum}`}
                      className={`px-3 py-2 font-montserrat text-sm ${
                        page === pageNum
                          ? "bg-[#FA4860] text-white"
                          : "bg-gray-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  )
                })}
              </div>

              {page < totalPages && (
                <Link
                  href={`/modelos?sort=${sortOption}&page=${page + 1}`}
                  className="px-4 py-2 bg-[#00B1DE] text-white font-montserrat text-sm"
                >
                  Siguiente
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA Banner at the bottom */}
      <CtaBanner
        title="The Bukkake Degree"
        description="Lorem ipsum dolor sit amet consectetur.Lorem ipsum dolor sit amet consectetur."
        buttonText="SUBSCRÍBETE"
        backgroundImage="/images/red-lips-bg.jpg"
      />
    </main>
  )
}
