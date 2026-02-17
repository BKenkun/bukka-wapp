interface SectionHeaderProps {
  title: string
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="w-full py-2" style={{ backgroundColor: "var(--sh-bg)" }}>
      <div className="flex items-center gap-4">
        {/* Left line */}
        <div className="flex-1" style={{ height: "var(--sh-line-height)", backgroundColor: "var(--sh-line-color)" }} />

        {/* Title */}
        <h2
          className="whitespace-nowrap leading-6"
          style={{
            color: "var(--sh-text)",
            fontSize: "var(--sh-font-size)",
            fontWeight: "var(--sh-font-weight)" as React.CSSProperties["fontWeight"],
            fontFamily: "var(--global-font)",
            textTransform: "var(--sh-text-transform)" as React.CSSProperties["textTransform"],
            letterSpacing: "var(--sh-letter-spacing)",
          }}
        >
          {title}
        </h2>

        {/* Right line */}
        <div className="flex-1" style={{ height: "var(--sh-line-height)", backgroundColor: "var(--sh-line-color)" }} />
      </div>
    </div>
  )
}
