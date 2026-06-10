"use client"

import { useState } from "react"
import Link from "next/link"

interface Post {
  id: string
  title: string
  description: string
  likes: number
  responses: number
  timeAgo: string
}

interface Reply {
  id: string
  postId: string
  postTitle: string
  content: string
  timeAgo: string
}

interface ProfileTabsProps {
  posts: Post[]
  replies: Reply[]
}

const tabs = ["Topics Created", "Replies"]

export function ProfileTabs({ posts, replies }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("Topics Created")

  return (
    <div className="p-6" style={{ background: "rgba(107, 114, 128, 0.38)" }}>
      {/* Tabs */}
      <div className="flex items-center gap-8 mb-6 border-b border-[#E5E7EB] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-montserrat text-[16px] font-medium transition-colors ${
              activeTab === tab ? "text-[#00B1DE]" : "text-white hover:text-[#00B1DE]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {activeTab === "Topics Created" && (
        <div className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <p className="text-white/60 font-montserrat text-center py-8">
              This user has not created any topics yet.
            </p>
          ) : (
            posts.map((post) => (
              <Link key={post.id} href={`/foro/${post.id}`}>
                <div className="border-l-4 border-[#FA4860] pl-4 py-2 hover:bg-white/5 transition-colors cursor-pointer">
                  <h3 className="font-montserrat text-white text-[16px] font-semibold leading-[24px] mb-1">
                    {post.title}
                  </h3>
                  <p className="font-montserrat text-white/70 text-[14px] font-normal leading-[20px] mb-2">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-4 text-[14px]">
                    <span className="flex items-center gap-1 text-[#FA4860]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      {post.likes} likes
                    </span>
                    <span className="flex items-center gap-1 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {post.responses} replies
                    </span>
                    <span className="text-white/60">{post.timeAgo}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Replies List */}
      {activeTab === "Replies" && (
        <div className="flex flex-col gap-4">
          {replies.length === 0 ? (
            <p className="text-white/60 font-montserrat text-center py-8">
              This user has not replied to any topics yet.
            </p>
          ) : (
            replies.map((reply) => (
              <Link key={reply.id} href={`/foro/${reply.postId}`}>
                <div className="border-l-4 border-[#00B1DE] pl-4 py-2 hover:bg-white/5 transition-colors cursor-pointer">
                  <p className="font-montserrat text-white/60 text-[12px] mb-1">
                    In reply to: <span className="text-white">{reply.postTitle}</span>
                  </p>
                  <p className="font-montserrat text-white text-[14px] font-normal leading-[20px] mb-2">
                    {reply.content}
                  </p>
                  <span className="text-white/60 text-[14px]">{reply.timeAgo}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
