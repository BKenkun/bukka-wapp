import { VideoCard } from "./video-card"

interface Performer {
  name: string
  slug: string
}

interface Video {
  id: string
  slug?: string
  title: string
  subtitle?: string
  views: string
  likes?: string
  imageUrl: string
  previewUrl?: string
  previewStartTime?: number
  previewEndTime?: number
  isVerified?: boolean
  category?: string
  performers?: Performer[]
  publishedAt?: Date | string
}

interface VideoGridProps {
  videos?: Video[]
  variant?: "overlay" | "below"
  columns?: 2 | 3 | 4
}

// Default mock data to match the design
const defaultVideos: Video[] = [
  {
    id: "1",
    title: "Lorem ipsum dolor sit amet consectetur.",
    subtitle: "Lorem ipsum",
    views: "75K",
    likes: "98%",
    imageUrl: "/fashion-model-portrait.png",
    isVerified: true,
  },
  {
    id: "2",
    title: "Lorem ipsum dolor sit amet consectetur.",
    subtitle: "Lorem ipsum",
    views: "75K",
    likes: "98%",
    imageUrl: "/elegant-woman-portrait.png",
    isVerified: true,
  },
  {
    id: "3",
    title: "Lorem ipsum dolor sit amet consectetur.",
    subtitle: "Lorem ipsum",
    views: "75K",
    likes: "98%",
    imageUrl: "/professional-model-photo.jpg",
    isVerified: true,
  },
  {
    id: "4",
    title: "Lorem ipsum dolor sit amet consectetur.",
    subtitle: "Lorem ipsum",
    views: "75K",
    likes: "98%",
    imageUrl: "/beauty-portrait-photography.jpg",
    isVerified: true,
  },
  {
    id: "5",
    title: "Lorem ipsum dolor sit amet consectetur.",
    subtitle: "Lorem ipsum",
    views: "75K",
    likes: "98%",
    imageUrl: "/modern-fashion-portrait.jpg",
    isVerified: true,
  },
  {
    id: "6",
    title: "Lorem ipsum dolor sit amet consectetur.",
    subtitle: "Lorem ipsum",
    views: "75K",
    likes: "98%",
    imageUrl: "/contemporary-model-portrait.jpg",
    isVerified: true,
  },
]

export function VideoGrid({ videos = defaultVideos, variant = "overlay", columns = 3 }: VideoGridProps) {
  const columnClass = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  }[columns] || "lg:grid-cols-3"

  return (
    <div className="w-full">
      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${columnClass} gap-x-4 gap-y-8`}
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            videoId={video.id}
            slug={video.slug || video.id}
            title={video.title}
            subtitle={video.subtitle}
            views={video.views}
            likes={video.likes}
            imageUrl={video.imageUrl}
            previewUrl={video.previewUrl}
            previewStartTime={video.previewStartTime}
            previewEndTime={video.previewEndTime}
            isVerified={video.isVerified}
            variant={variant}
            category={video.category}
            performers={video.performers}
            publishedAt={video.publishedAt}
          />
        ))}
      </div>
    </div>
  )
}
