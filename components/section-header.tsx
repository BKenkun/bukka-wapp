interface SectionHeaderProps {
  title: string
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="w-full bg-black py-2">
      <div className="flex items-center gap-4">
        {/* Left line */}
        <div className="flex-1 h-[1px] bg-white" />

        {/* Title */}
        <h2 className="text-white text-base font-bold font-['Montserrat'] leading-6 whitespace-nowrap uppercase tracking-wide">
          {title}
        </h2>

        {/* Right line */}
        <div className="flex-1 h-[1px] bg-white" />
      </div>
    </div>
  )
}
