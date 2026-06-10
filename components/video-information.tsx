import Link from "next/link"

interface Performer {
  id: string
  slug: string
  name: string
}

interface Category {
  id: string
  slug: string
  name: string
}

interface VideoInformationProps {
  description?: string | null
  performers: Performer[]
  tags: string[]
  director?: string
  releaseDate?: Date | null
  duration?: number | null
  categories?: Category[]
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function VideoInformation({ description, performers, tags, director, releaseDate, duration, categories }: VideoInformationProps) {
  // Si no hay información, no mostrar nada
  if (!description && performers.length === 0 && tags.length === 0 && !director && !releaseDate && !duration && (!categories || categories.length === 0)) {
    return null
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-4" style={{ color: "var(--text-primary)" }}>
        {performers.length > 0 && (
          <div>
            <span className="font-bold text-base leading-6">
              {performers.length > 1 ? "Actrices: " : "Actriz: "}
            </span>
            <span className="font-normal text-base leading-6">
              {performers.map((performer, index) => (
                <span key={performer.id}>
                  <Link
                    href={`/modelos/${performer.slug}`}
                    className="hover:opacity-80 transition-colors"
                  >
                    {performer.name}
                  </Link>
                  {index < performers.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          </div>
        )}

        {director && (
          <div>
            <span className="font-bold text-base leading-6">Dirigido por: </span>
            <span className="font-normal text-base leading-6">{director}</span>
          </div>
        )}

        {releaseDate && (
          <div>
            <span className="font-bold text-base leading-6">Fecha de lanzamiento: </span>
            <span className="font-normal text-base leading-6">
              {new Date(releaseDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        )}

        {duration !== null && duration !== undefined && duration > 0 && (
          <div>
            <span className="font-bold text-base leading-6">Duration: </span>
            <span className="font-normal text-base leading-6">{formatDuration(duration)}</span>
          </div>
        )}

        {categories && categories.length > 0 && (
          <div>
            <span className="font-bold text-base leading-6">
              {categories.length > 1 ? "Categories: " : "Category: "}
            </span>
            <span className="font-normal text-base leading-6">
              {categories.map((category, index) => (
                <span key={category.id}>
                  <Link
                    href={`/videos/${category.slug}`}
                    className="hover:opacity-80 transition-colors"
                  >
                    {category.name}
                  </Link>
                  {index < categories.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          </div>
        )}

        {description && (
          <div>
            <span className="font-bold text-base leading-6">Description: </span>
            <span className="font-normal text-base leading-6">{description}</span>
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="font-normal hover:opacity-80 cursor-pointer transition-colors"
                style={{ color: "var(--accent-color)", fontSize: "15.206px", lineHeight: "22.809px" }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
