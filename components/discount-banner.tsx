export function DiscountBanner() {
  return (
    <div className="w-full bg-[#00B1DE] py-4 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <span className="text-white font-bold font-['Montserrat'] text-[16px] leading-[24px] uppercase tracking-wide text-center md:text-left">
        DESCUENTO ESPECIAL PARA MIEMBROS DIAMANTE -30%
      </span>
      <button className="border-2 border-white text-white px-6 py-2 font-bold font-['Montserrat'] text-[14px] leading-[24px] uppercase hover:bg-white hover:text-[#00B1DE] transition-colors whitespace-nowrap">
        SUBSCRÍBETE AHORA
      </button>
    </div>
  )
}
