import Image from "next/image"
import Link from "next/link"

interface CtaBannerProps {
  title: string
  description: string
  buttonText: string
  buttonUrl?: string
  backgroundImage?: string
}

export function CtaBanner({
  title,
  description,
  buttonText,
  buttonUrl,
  backgroundImage = "/red-lips-artistic.jpg",
}: CtaBannerProps) {
  const ButtonContent = (
    <span className="flex justify-center items-center w-[183px] h-[39px] px-[32px] py-[7px] gap-[10px] bg-[#FA4860] hover:bg-[#d63d52] text-white text-[16px] font-bold leading-[24px] uppercase font-montserrat rounded-none mt-8">
      {buttonText}
    </span>
  )

  return (
    <div className="relative w-full h-[486px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src={backgroundImage || "/placeholder.svg"} alt="Background" fill className="object-cover" priority />
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-4">
        <h2 className="text-white text-[32px] font-bold leading-[48px] font-montserrat">"{title}"</h2>

        {/* Changed margin to exactly match the requested 29px gap for the subtitle */}
        <p className="text-white text-[18px] font-bold leading-[48px] font-montserrat mt-[29px]">{description}</p>

        {/* Button with optional link */}
        {buttonUrl ? (
          <Link href={buttonUrl}>{ButtonContent}</Link>
        ) : (
          <button className="flex justify-center items-center w-[183px] h-[39px] px-[32px] py-[7px] gap-[10px] bg-[#FA4860] hover:bg-[#d63d52] text-white text-[16px] font-bold leading-[24px] uppercase font-montserrat rounded-none mt-8">
            {buttonText}
          </button>
        )}
      </div>
    </div>
  )
}
