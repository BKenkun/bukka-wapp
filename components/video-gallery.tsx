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
    <div className="w-full py-8 flex justify-center">
      <div className="flex flex-wrap justify-center gap-[13px]">
        {images.map((image, index) => (
          <div key={index} className="relative w-[290px] aspect-[4/5] overflow-hidden">
            <Image src={image.src || "/placeholder.svg"} alt={image.alt} fill className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}
