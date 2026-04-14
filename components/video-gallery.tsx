import Image from "next/image"

interface GalleryImage {
  src: string
  alt: string
}

interface VideoGalleryProps {
  images: GalleryImage[]
}

export function VideoGallery({ images }: VideoGalleryProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-video overflow-hidden group cursor-pointer"
        >
          <Image
            src={image.src || "/placeholder.svg"}
            alt={image.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      ))}
    </div>
  )
}
