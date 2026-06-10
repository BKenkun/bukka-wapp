"use client"

import { useState } from "react"
import { useAuthModal } from "@/components/auth/auth-modal-provider"

interface PollOption {
  id: string
  text: string
  votes: number
  votedByMe: boolean
}

interface PollWidgetProps {
  pollId: string
  question: string
  multiple: boolean
  endsAt: string | null
  options: PollOption[]
  isLoggedIn: boolean
}

export function PollWidget({ pollId, question, multiple, endsAt, options: initialOptions, isLoggedIn }: PollWidgetProps) {
  const { openAuthModal } = useAuthModal()
  const [options, setOptions] = useState<PollOption[]>(initialOptions)
  const [isVoting, setIsVoting] = useState(false)

  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0)
  const hasEnded = endsAt ? new Date(endsAt).getTime() < Date.now() : false

  const handleVote = async (optionId: string) => {
    if (!isLoggedIn) {
      openAuthModal()
      return
    }
    if (hasEnded || isVoting) return

    const previous = options

    // Optimistic update
    setOptions((current) =>
      current.map((option) => {
        if (option.id === optionId) {
          return option.votedByMe
            ? { ...option, votedByMe: false, votes: Math.max(0, option.votes - 1) }
            : { ...option, votedByMe: true, votes: option.votes + 1 }
        }
        if (!multiple && option.votedByMe) {
          return { ...option, votedByMe: false, votes: Math.max(0, option.votes - 1) }
        }
        return option
      })
    )

    setIsVoting(true)
    try {
      const response = await fetch(`/api/forum/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      })
      if (!response.ok) throw new Error("Vote failed")
      const data = await response.json()
      setOptions(data.options)
    } catch {
      setOptions(previous)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="p-4 md:p-6 mb-4 md:mb-6" style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--surface-bg)" }}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="font-montserrat text-[15px] md:text-[16px] font-bold leading-[24px]" style={{ color: "var(--text-primary)" }}>
          {question}
        </p>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-color)" strokeWidth="2" className="flex-shrink-0 mt-0.5">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      </div>
      <p className="font-montserrat text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>
        {hasEnded ? "Poll ended" : multiple ? "Select one or more options" : "Select one option"}
      </p>

      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              disabled={hasEnded}
              className="relative w-full text-left px-3 py-2.5 overflow-hidden transition-opacity disabled:cursor-default"
              style={{
                border: option.votedByMe
                  ? "1px solid var(--brand-color)"
                  : "1px solid var(--border-color)",
                backgroundColor: "var(--global-bg)",
                cursor: hasEnded ? "default" : "pointer",
              }}
            >
              {/* Progress bar */}
              <div
                className="absolute inset-y-0 left-0 transition-all duration-300"
                style={{
                  width: `${percent}%`,
                  backgroundColor: option.votedByMe
                    ? "color-mix(in srgb, var(--brand-color) 35%, transparent)"
                    : "color-mix(in srgb, var(--brand-color) 18%, transparent)",
                }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                  {option.votedByMe && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-color)" strokeWidth="3" className="flex-shrink-0">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                  <span className="font-montserrat text-[13px] md:text-[14px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {option.text}
                  </span>
                </span>
                <span className="flex items-baseline gap-2 flex-shrink-0">
                  <span className="font-montserrat text-[13px] md:text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    {percent}%
                  </span>
                  <span className="font-montserrat text-[11px] md:text-[12px]" style={{ color: "var(--text-muted)" }}>
                    {option.votes} {option.votes === 1 ? "vote" : "votes"}
                  </span>
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <p className="font-montserrat text-[12px] mt-3" style={{ color: "var(--text-muted)" }}>
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        {endsAt && !hasEnded && ` · Ends ${new Date(endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
      </p>
    </div>
  )
}
