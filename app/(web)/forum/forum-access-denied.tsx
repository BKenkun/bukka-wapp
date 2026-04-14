import Link from "next/link"

interface ForumAccessDeniedProps {
  isLoggedIn: boolean
  currentPlanName?: string | null
}

export function ForumAccessDenied({ isLoggedIn, currentPlanName }: ForumAccessDeniedProps) {
  return (
    <div className="flex-1 flex flex-col font-sans" style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}>
      <div className="px-4 md:px-8 pt-24 md:pt-28">
        <h1 className="font-montserrat text-[24px] md:text-[30px] font-bold leading-[32px] md:leading-[36px]" style={{ color: "var(--text-primary)" }}>Forum</h1>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-lg text-center px-4">
          {/* Lock Icon */}
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--brand-color) 20%, transparent)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--brand-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-12 md:h-12">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <h2 className="font-montserrat text-[20px] md:text-[24px] font-bold mb-3 md:mb-4" style={{ color: "var(--text-primary)" }}>
            Exclusive Access
          </h2>

          <p className="font-montserrat text-[14px] md:text-[16px] leading-[22px] md:leading-[24px] mb-4 md:mb-6" style={{ color: "var(--text-secondary)" }}>
            The forum is available exclusively for members{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Gold</span>,{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Platinum</span> and{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Diamond</span>.
          </p>

          {isLoggedIn ? (
            <>
              <p className="font-montserrat text-[13px] md:text-[14px] mb-6 md:mb-8" style={{ color: "var(--text-muted)" }}>
                Your current plan: <span className="font-medium" style={{ color: "var(--text-primary)" }}>{currentPlanName || "Free"}</span>
              </p>
              <Link href="/my-account/subscription">
                <button className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 font-montserrat text-[14px] md:text-[16px] font-medium transition-colors cursor-pointer" style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}>
                  Upgrade my Plan
                </button>
              </Link>
            </>
          ) : (
            <>
              <p className="font-montserrat text-[13px] md:text-[14px] mb-6 md:mb-8" style={{ color: "var(--text-muted)" }}>
                Sign in or register to access the forum.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                <Link href="/?login=true" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 font-montserrat text-[14px] md:text-[16px] font-medium transition-colors cursor-pointer" style={{ backgroundColor: "var(--accent-color)", color: "var(--text-primary)" }}>
                    Sign In
                  </button>
                </Link>
                <Link href="/?register=true" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 font-montserrat text-[14px] md:text-[16px] font-medium transition-colors cursor-pointer" style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
                    Register
                  </button>
                </Link>
              </div>
            </>
          )}

          {/* Features */}
          <div className="mt-8 md:mt-12 pt-6 md:pt-8" style={{ borderTop: "1px solid var(--border-color)" }}>
            <p className="font-montserrat text-[13px] md:text-[14px] mb-3 md:mb-4" style={{ color: "var(--text-muted)" }}>
              With forum access you can:
            </p>
            <div className="flex flex-col gap-2 md:gap-3">
              {["Participate in community discussions", "Create topics and reply to other users", "Connect with other community members"].map((text) => (
                <div key={text} className="flex items-center gap-2 md:gap-3 justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" className="flex-shrink-0">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="font-montserrat text-[13px] md:text-[14px]" style={{ color: "var(--text-secondary)" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
