"use client"

interface VideoPlayerProps {
  thumbnailUrl: string
  title: string
  isLocked?: boolean
}

export function VideoPlayer({ thumbnailUrl, title, isLocked = true }: VideoPlayerProps) {
  return (
    <div className="relative w-full aspect-video overflow-hidden">
      {/* Blurred background image */}
      <img
        src={thumbnailUrl || "/placeholder.svg?height=600&width=900&query=woman blurred"}
        alt={title}
        className={`w-full h-full object-cover ${isLocked ? "blur-sm" : ""}`}
      />

      {/* Access Denied Overlay - Applied exact Figma specs */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="bg-black flex flex-col items-start gap-[10px]"
            style={{
              width: "481px",
              height: "204px",
              padding: "37px 70px",
            }}
          >
            <h2
              className="text-white text-center w-full uppercase"
              style={{
                fontSize: "24px",
                fontWeight: 600,
                lineHeight: "24px",
              }}
            >
              Acceso Denegado
            </h2>
            <p
              className="text-white w-full"
              style={{
                fontSize: "16px",
                fontWeight: 600,
                lineHeight: "24px",
              }}
            >
              Lorem ipsum dolor sit amet consectetur.
            </p>
            <button
              className="bg-[#FA4860] hover:bg-[#e03d53] text-white uppercase flex justify-center items-center transition-colors mx-auto"
              style={{
                fontSize: "16px",
                fontWeight: 600,
                lineHeight: "24px",
                padding: "10.5px 35px 9.5px 34px",
              }}
            >
              Acceder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
