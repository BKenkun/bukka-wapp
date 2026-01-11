import Image from "next/image"

interface OrderCardProps {
  imageSrc: string
  title: string
  price: string
  status: string
}

export function OrderCard({ imageSrc, title, price, status }: OrderCardProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-[961px] bg-[#3B3B3B] px-6 py-3">
      <div className="flex items-center gap-6">
        <div className="w-[120px] h-[80px] relative flex-shrink-0">
          <Image src={imageSrc || "/placeholder.svg"} alt={title} fill className="object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="text-white font-montserrat text-[20px] font-semibold leading-7">{title}</h3>
          <p className="text-white font-montserrat text-[18px] font-semibold leading-7">{price}</p>
        </div>
      </div>
      <div className="border border-[#00B1DE] px-8 py-3">
        <span className="text-white text-center font-montserrat text-[14px] font-medium leading-normal uppercase">
          {status}
        </span>
      </div>
    </div>
  )
}
