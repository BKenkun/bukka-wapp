import Image from "next/image"
import Link from "next/link"

interface HeroProps {
  backgroundImage?: string
  videoUrl?: string | null
  linkUrl?: string | null
  openInNewTab?: boolean
}

export function Hero({
  backgroundImage = "/images/background.png",
  videoUrl,
  linkUrl,
  openInNewTab = false,
}: HeroProps) {
  const content = (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: "var(--global-bg)" }}>
      {/* Imagen siempre de base: hace de póster mientras el video carga */}
      <Image
        src={backgroundImage}
        alt="Background"
        fill
        className="object-cover object-center"
        priority
      />
      {videoUrl && (
        <video
          src={videoUrl}
          poster={backgroundImage}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  )

  if (linkUrl) {
    if (openInNewTab) {
      return (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      )
    }
    return <Link href={linkUrl}>{content}</Link>
  }

  return content
}
