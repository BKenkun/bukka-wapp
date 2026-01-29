"use client"

import { useState } from "react"
import type { MegamenuData } from "@/types/megamenu"
import { MegamenuPerformerCard } from "./megamenu-performer-card"
import { MegamenuVideoCard } from "./megamenu-video-card"
import { MegamenuLinkItem } from "./megamenu-link-item"

interface MegamenuProps {
  data: MegamenuData
}

export function Megamenu({ data }: MegamenuProps) {
  const { performers, videos, links, linksSectionTitle } = data
  const [currentPerformerIndex, setCurrentPerformerIndex] = useState(0)

  const hasPerformers = performers.length > 0
  const hasVideos = videos.length > 0
  const hasLinks = links.length > 0

  if (!hasPerformers && !hasVideos && !hasLinks) {
    return (
      <div className="w-full px-8 py-8 text-center text-zinc-500">
        <p className="text-sm">Configura el megamenu desde el panel de administración</p>
      </div>
    )
  }

  const nextPerformer = () => {
    setCurrentPerformerIndex((prev) => (prev + 1) % performers.length)
  }

  const prevPerformer = () => {
    setCurrentPerformerIndex((prev) => (prev - 1 + performers.length) % performers.length)
  }

  // CASE 1: Only performers (no videos, no links) - show side by side
  if (hasPerformers && !hasVideos && !hasLinks) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-white font-bold text-sm">Modelos</h3>
        </div>
        <div className="grid grid-cols-4 gap-4 max-w-3xl">
          {performers.map((performer) => (
            <MegamenuPerformerCard key={performer.id} performer={performer} />
          ))}
        </div>
      </div>
    )
  }

  // CASE 2: Only links (no videos, no performers)
  if (hasLinks && !hasVideos && !hasPerformers) {
    return (
      <div className="w-full px-8 py-6">
        <h3 className="text-white font-bold text-sm mb-4">{linksSectionTitle}</h3>
        <nav className="flex flex-wrap gap-x-8 gap-y-1">
          {links.map((link) => (
            <MegamenuLinkItem key={link.id} link={link} />
          ))}
        </nav>
      </div>
    )
  }

  // CASE 3: Only videos
  if (hasVideos && !hasPerformers && !hasLinks) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-white font-bold text-sm">Videos destacados</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {videos.slice(0, 4).map((video) => (
            <MegamenuVideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    )
  }

  // CASE 4: Performers + Links (no videos) - links first, then performers side by side
  if (hasPerformers && hasLinks && !hasVideos) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex gap-8">
          {/* Links section */}
          <div className="w-44 flex-shrink-0">
            <h3 className="text-white font-bold text-sm mb-4">{linksSectionTitle}</h3>
            <nav className="space-y-1">
              {links.map((link) => (
                <MegamenuLinkItem key={link.id} link={link} />
              ))}
            </nav>
          </div>

          {/* Performers side by side */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-white font-bold text-sm">Modelos</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {performers.map((performer) => (
                <MegamenuPerformerCard key={performer.id} performer={performer} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // CASE 5: Performers + Videos (no links) - split in half
  if (hasPerformers && hasVideos && !hasLinks) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex gap-8">
          {/* Videos section - takes more space */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-white font-bold text-sm">Videos destacados</h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {videos.slice(0, 4).map((video) => (
                <MegamenuVideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>

          {/* Performers carousel */}
          <div className="w-48 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-white font-bold text-sm">Modelos</h3>
            </div>
            <PerformerCarousel
              performers={performers}
              currentIndex={currentPerformerIndex}
              onNext={nextPerformer}
              onPrev={prevPerformer}
              onDotClick={setCurrentPerformerIndex}
            />
          </div>
        </div>
      </div>
    )
  }

  // CASE 6: Links + Videos (no performers)
  if (hasLinks && hasVideos && !hasPerformers) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex gap-8">
          {/* Links section */}
          <div className="w-44 flex-shrink-0">
            <h3 className="text-white font-bold text-sm mb-4">{linksSectionTitle}</h3>
            <nav className="space-y-1">
              {links.map((link) => (
                <MegamenuLinkItem key={link.id} link={link} />
              ))}
            </nav>
          </div>

          {/* Videos section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-white font-bold text-sm">Videos destacados</h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {videos.slice(0, 4).map((video) => (
                <MegamenuVideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // CASE 7: All three - Links, Videos, Performers (carousel)
  return (
    <div className="w-full px-8 py-6">
      <div className="flex gap-6">
        {/* Links section */}
        <div className="w-44 flex-shrink-0">
          <h3 className="text-white font-bold text-sm mb-4">{linksSectionTitle}</h3>
          <nav className="space-y-1">
            {links.map((link) => (
              <MegamenuLinkItem key={link.id} link={link} />
            ))}
          </nav>
        </div>

        {/* Videos section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-white font-bold text-sm">Videos destacados</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {videos.slice(0, 4).map((video) => (
              <MegamenuVideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>

        {/* Performers carousel */}
        <div className="w-48 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-white font-bold text-sm">Modelos</h3>
          </div>
          <PerformerCarousel
            performers={performers}
            currentIndex={currentPerformerIndex}
            onNext={nextPerformer}
            onPrev={prevPerformer}
            onDotClick={setCurrentPerformerIndex}
          />
        </div>
      </div>
    </div>
  )
}

// Extracted carousel component for reuse
function PerformerCarousel({
  performers,
  currentIndex,
  onNext,
  onPrev,
  onDotClick,
}: {
  performers: MegamenuData["performers"]
  currentIndex: number
  onNext: () => void
  onPrev: () => void
  onDotClick: (index: number) => void
}) {
  return (
    <div className="relative">
      {/* Navigation arrows */}
      {performers.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors cursor-pointer"
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onNext}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors cursor-pointer"
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Performer card */}
      <div className="overflow-hidden">
        <MegamenuPerformerCard performer={performers[currentIndex]} />
      </div>

      {/* Dots indicator */}
      {performers.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {performers.map((_, index) => (
            <button
              key={index}
              onClick={() => onDotClick(index)}
              className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${
                index === currentIndex ? 'bg-[#FA4860]' : 'bg-zinc-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
