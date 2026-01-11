import { VideoCard } from "./video-card"

interface Video {
  id: string
  title: string
  subtitle: string
  views: string
  likes: string
  imageUrl: string
  isVerified?: boolean
}

interface VideoGridProps {
  videos?: Video[]
  variant?: "overlay" | "below"
  columns?: 2 | 3
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

export function VideoGrid({ videos = defaultVideos, variant = "overlay", columns }: VideoGridProps) {
  return (
    <div className="w-full">
      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${
          columns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"
        } gap-x-4 gap-y-8`}
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            title={video.title}
            subtitle={video.subtitle}
            views={video.views}
            likes={video.likes}
            imageUrl={video.imageUrl}
            isVerified={video.isVerified}
            variant={variant}
          />
        ))}
      </div>
    </div>
  )
}
