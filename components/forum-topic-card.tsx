import Image from "next/image"
import Link from "next/link"

interface ForumTopicCardProps {
  id: string
  avatar?: string | null
  tags: { label: string; variant: "orange" | "red" | "gray" }[]
  title: string
  description: string
  author: string
  timeAgo: string
  views: string | number
  comments: number
  likes: number
  isPinned?: boolean
  hasNewActivity?: boolean
  showHighlight?: boolean
}

export function ForumTopicCard({
  id,
  avatar,
  tags,
  title,
  description,
  author,
  timeAgo,
  views,
  comments,
  likes,
  isPinned = false,
  hasNewActivity = false,
  showHighlight = false,
}: ForumTopicCardProps) {
  return (
    <Link href={`/foro/${id}`}>
      <div
        className={`${showHighlight ? "border-l-4 border-[#FA4860]" : ""} p-6 flex gap-4 cursor-pointer hover:opacity-90 transition-opacity`}
        style={{
          background: "rgba(107, 114, 128, 0.22)",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-600 relative">
            {avatar ? (
              <Image
                src={avatar}
                alt={author}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                {author.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Tags row */}
          <div className="flex items-center gap-2">
            {isPinned && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="14"
                viewBox="0 0 12 14"
                fill="none"
                className="mr-1"
              >
                <path
                  d="M11.7188 5.25L8.75 2.28125V1.75C8.75 0.921875 8.07812 0.25 7.25 0.25H4.75C3.92188 0.25 3.25 0.921875 3.25 1.75V2.28125L0.28125 5.25C0.09375 5.4375 0 5.71875 0 6V6.625C0 7.04688 0.328125 7.375 0.75 7.375H5.25V11.5L4.5 12.25V13.375C4.5 13.5938 4.65625 13.75 4.875 13.75H7.125C7.34375 13.75 7.5 13.5938 7.5 13.375V12.25L6.75 11.5V7.375H11.25C11.6719 7.375 12 7.04688 12 6.625V6C12 5.71875 11.9062 5.4375 11.7188 5.25Z"
                  fill="#FA4860"
                />
              </svg>
            )}
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-1 font-montserrat text-[12px] font-normal ${
                  tag.variant === "orange"
                    ? "bg-[#F59E0B] text-white"
                    : tag.variant === "red"
                      ? "bg-[#FEE2E2] text-[#B91C1C]"
                      : "bg-[#E5E7EB] text-[#374151]"
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="font-montserrat text-white text-[18px] font-semibold leading-[28px]">{title}</h3>

          {/* Description */}
          <p className="font-montserrat text-white text-[16px] font-normal leading-[24px]">{description}</p>

          {/* Meta info */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 font-montserrat text-white text-[14px] font-normal leading-[20px]">
              <span>Por {author}</span>
              <span>•</span>
              <span>{timeAgo}</span>
              {/* Eye icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="14"
                viewBox="0 0 16 14"
                fill="none"
                className="ml-2"
              >
                <g clipPath="url(#clip0_eye)">
                  <path
                    d="M7.87505 0.875C5.66567 0.875 3.89653 1.88125 2.60864 3.07891C1.32896 4.26562 0.473096 5.6875 0.0684082 6.66367C-0.0218262 6.87969 -0.0218262 7.12031 0.0684082 7.33633C0.473096 8.3125 1.32896 9.73438 2.60864 10.9211C3.89653 12.1187 5.66567 13.125 7.87505 13.125C10.0844 13.125 11.8536 12.1187 13.1415 10.9211C14.4211 9.73164 15.277 8.3125 15.6844 7.33633C15.7747 7.12031 15.7747 6.87969 15.6844 6.66367C15.277 5.6875 14.4211 4.26562 13.1415 3.07891C11.8536 1.88125 10.0844 0.875 7.87505 0.875ZM3.93755 7C3.93755 5.95571 4.35239 4.95419 5.09082 4.21577C5.82924 3.47734 6.83076 3.0625 7.87505 3.0625C8.91934 3.0625 9.92086 3.47734 10.6593 4.21577C11.3977 4.95419 11.8125 5.95571 11.8125 7C11.8125 8.04429 11.3977 9.04581 10.6593 9.78423C9.92086 10.5227 8.91934 10.9375 7.87505 10.9375C6.83076 10.9375 5.82924 10.5227 5.09082 9.78423C4.35239 9.04581 3.93755 8.04429 3.93755 7ZM7.87505 5.25C7.87505 6.21523 7.09028 7 6.12505 7C5.93091 7 5.74497 6.96719 5.56997 6.90977C5.41958 6.86055 5.24458 6.95352 5.25005 7.11211C5.25825 7.30078 5.2856 7.48945 5.33755 7.67812C5.71216 9.07812 7.15317 9.90938 8.55317 9.53477C9.95317 9.16016 10.7844 7.71914 10.4098 6.31914C10.1063 5.18438 9.10278 4.42148 7.98716 4.375C7.82856 4.36953 7.7356 4.5418 7.78481 4.69492C7.84224 4.86992 7.87505 5.05586 7.87505 5.25Z"
                    fill="white"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_eye">
                    <path d="M0 0H15.75V14H0V0Z" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <span>{views}</span>
            </div>

            {/* Right side stats */}
            <div className="flex items-center gap-4">
              {/* Comments */}
              <div className="flex items-center gap-1 font-montserrat text-white text-[14px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 0C3.58125 0 0 2.91562 0 6.5C0 8.21562 0.80625 9.76875 2.125 10.9187C1.80625 12.1437 0.840625 13.2312 0.828125 13.2437C0.75 13.3312 0.73125 13.4562 0.778125 13.5625C0.825 13.6687 0.921875 13.75 1.04375 13.75C2.80625 13.75 4.21875 13.0063 5.0625 12.4187C5.98125 12.7562 6.9625 12.9375 8 12.9375C12.4188 12.9375 16 10.0219 16 6.4375C16 2.85313 12.4188 0 8 0Z"
                    fill="white"
                  />
                </svg>
                <span>{comments}</span>
              </div>

              {/* Likes */}
              <div className="flex items-center gap-1 font-montserrat text-[#FA4860] text-[14px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none">
                  <path
                    d="M14.2344 1.26562C12.5156 -0.296875 9.82812 -0.109375 8.25 1.53125L8 1.79688L7.75 1.53125C6.17188 -0.109375 3.48438 -0.296875 1.76562 1.26562C-0.171875 3.01562 -0.265625 6.01562 1.48438 7.89062L7.26562 13.9531C7.67188 14.3906 8.32812 14.3906 8.73438 13.9531L14.5156 7.89062C16.2656 6.01562 16.1719 3.01562 14.2344 1.26562Z"
                    fill="#FA4860"
                  />
                </svg>
                <span>{likes}</span>
              </div>

              {/* New activity indicator */}
              {hasNewActivity && <div className="w-3 h-3 rounded-full bg-[#00B1DE]" />}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
