import type React from "react"

interface InteractionCardProps {
  title: string
  count: string
  icon: React.ReactNode
}

export function InteractionCard({ title, count, icon }: InteractionCardProps) {
  return (
    <div className="flex-1 flex items-center justify-between bg-[#3B3B3B] border-0 border-[rgba(229,231,235,0.43)] p-6 gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-white font-montserrat text-[20.956px] font-semibold leading-[29.937px]">{title}</p>
        <p className="text-white font-inter text-[35.925px] font-bold leading-[47.9px]">{count}</p>
      </div>
      <div className="flex-shrink-0">{icon}</div>
    </div>
  )
}
