import Image from "next/image"
import Link from "next/link"

interface HeroProps {
  backgroundImage?: string
  videoId?: string | null
  linkUrl?: string | null
}

export function Hero({
  backgroundImage = "/images/background.png",
  videoId,
  linkUrl,
}: HeroProps) {
  const content = (
    <div className="relative w-full h-[calc(100vh-40px)] overflow-hidden bg-black">
      {videoId ? (
        // Render Mux video if videoId is provided
        <video
          src={`https://stream.mux.com/${videoId}.m3u8`}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        // Render image if no videoId
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          className="object-cover object-center"
          priority
        />
      )}
    </div>
  )

  if (linkUrl) {
    return <Link href={linkUrl}>{content}</Link>
  }

  return content
}
