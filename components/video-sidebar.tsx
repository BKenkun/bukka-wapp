"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function VideoSidebar() {
  const [activeGroup, setActiveGroup] = useState("Todo")
  const [selectedRadio, setSelectedRadio] = useState<string | null>("radio-1")
  const [selectedChecks, setSelectedChecks] = useState<string[]>([])

  const alphabetGroups = ["Todo", "A-C", "D-F", "G-I", "M-O", "P-R", "S-U", "V-Z"]

  return (
    <aside className="w-full text-white font-montserrat">
      <h3 className="text-white font-montserrat text-[18px] font-semibold leading-[28px] mb-6">Filtros:</h3>

      <p className="text-white font-montserrat text-[14px] font-medium leading-[20px] mb-3">Alfabético:</p>

      {/* Alphabet Filter */}
      <div className="grid grid-cols-4 gap-2 mb-12">
        {alphabetGroups.map((group) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={cn(
              "h-10 text-sm font-medium transition-colors",
              activeGroup === group ? "bg-[#00B1DE] text-white" : "bg-[#F3F4F6] text-[#374151]",
            )}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Radio Section */}
      <div className="space-y-4 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <label key={`radio-${i}`} className="flex items-center gap-3 cursor-pointer group">
            <div
              className={cn(
                "w-5 h-5 rounded-full border border-[#FA4860] flex items-center justify-center transition-colors",
                selectedRadio === `radio-${i}` ? "bg-[#00B1DE] border-[#00B1DE]" : "",
              )}
            >
              {selectedRadio === `radio-${i}` && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
            </div>
            <div className="h-4 w-32 bg-gray-100/10 rounded" /> {/* Placeholder for text */}
            <input
              type="radio"
              name="filter-radio"
              className="hidden"
              checked={selectedRadio === `radio-${i}`}
              onChange={() => setSelectedRadio(`radio-${i}`)}
            />
          </label>
        ))}
      </div>

      {/* Checkbox Section 1 */}
      <div className="space-y-4 mb-12">
        {[1, 2, 3, 4, 5].map((i) => (
          <label key={`check1-${i}`} className="flex items-center gap-3 cursor-pointer group">
            <div
              className={cn(
                "w-5 h-5 border border-[#FA4860] flex items-center justify-center transition-colors",
                selectedChecks.includes(`check1-${i}`) ? "bg-[#00B1DE] border-[#00B1DE]" : "",
              )}
            >
              {selectedChecks.includes(`check1-${i}`) && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-4 h-4 text-white"
                  strokeWidth={3}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div className="h-4 w-32 bg-gray-100/10 rounded" /> {/* Placeholder for text */}
            <input
              type="checkbox"
              className="hidden"
              onChange={() => {
                setSelectedChecks((prev) =>
                  prev.includes(`check1-${i}`) ? prev.filter((id) => id !== `check1-${i}`) : [...prev, `check1-${i}`],
                )
              }}
            />
          </label>
        ))}
      </div>

      {/* Checkbox Section 2 */}
      <div className="space-y-4 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <label key={`check2-${i}`} className="flex items-center gap-3 cursor-pointer group">
            <div
              className={cn(
                "w-5 h-5 border border-[#FA4860] flex items-center justify-center transition-colors",
                selectedChecks.includes(`check2-${i}`) ? "bg-[#00B1DE] border-[#00B1DE]" : "",
              )}
            >
              {selectedChecks.includes(`check2-${i}`) && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-4 h-4 text-white"
                  strokeWidth={3}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div className="h-4 w-32 bg-gray-100/10 rounded" /> {/* Placeholder for text */}
            <input
              type="checkbox"
              className="hidden"
              onChange={() => {
                setSelectedChecks((prev) =>
                  prev.includes(`check2-${i}`) ? prev.filter((id) => id !== `check2-${i}`) : [...prev, `check2-${i}`],
                )
              }}
            />
          </label>
        ))}
      </div>

      <button
        onClick={() => {
          setSelectedRadio(null)
          setSelectedChecks([])
          setActiveGroup("Todo")
        }}
        className="w-full bg-[#FA4860] text-white py-4 font-bold text-sm tracking-wide hover:bg-[#fa4860]/90 transition-colors"
      >
        Borrar todos los filtros
      </button>
    </aside>
  )
}
