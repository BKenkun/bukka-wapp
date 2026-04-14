import Image from "next/image"

interface OrderCardProps {
  imageSrc: string
  title: string
  price: string
  status: string
}

export function OrderCard({ imageSrc, title, price, status }: OrderCardProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-[961px] px-6 py-3" style={{ backgroundColor: "var(--surface-bg)", border: "1px solid var(--border-color)" }}>
      <div className="flex items-center gap-6">
        <div className="w-[120px] h-[80px] relative flex-shrink-0">
          <Image src={imageSrc || "/placeholder.svg"} alt={title} fill className="object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="font-montserrat text-[20px] font-semibold leading-7" style={{ color: "var(--text-primary)" }}>{title}</h3>
          <p className="font-montserrat text-[18px] font-semibold leading-7" style={{ color: "var(--text-primary)" }}>{price}</p>
        </div>
      </div>
      <div className="px-8 py-3" style={{ border: "1px solid var(--accent-color)" }}>
        <span className="text-center font-montserrat text-[14px] font-medium leading-normal uppercase" style={{ color: "var(--text-primary)" }}>
          {status}
        </span>
      </div>
    </div>
  )
}
