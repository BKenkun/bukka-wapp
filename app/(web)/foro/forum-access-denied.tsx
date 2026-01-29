import Link from "next/link"

interface ForumAccessDeniedProps {
  isLoggedIn: boolean
  currentPlanName?: string | null
}

export function ForumAccessDenied({ isLoggedIn, currentPlanName }: ForumAccessDeniedProps) {
  return (
    <div className="flex-1 flex flex-col font-sans bg-black text-white">
      <div className="px-4 md:px-8 pt-24 md:pt-28">
        <h1 className="font-montserrat text-white text-[24px] md:text-[30px] font-bold leading-[32px] md:leading-[36px]">Foro</h1>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-lg text-center px-4">
          {/* Lock Icon */}
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-[#FA4860]/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FA4860"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="md:w-12 md:h-12"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <h2 className="font-montserrat text-white text-[20px] md:text-[24px] font-bold mb-3 md:mb-4">
            Acceso Exclusivo
          </h2>

          <p className="font-montserrat text-white/70 text-[14px] md:text-[16px] leading-[22px] md:leading-[24px] mb-4 md:mb-6">
            El foro está disponible exclusivamente para miembros{" "}
            <span className="text-[#FEF9C3] font-semibold">Gold</span>,{" "}
            <span className="text-[#EDE9FE] font-semibold">Platinum</span> y{" "}
            <span className="text-[#DBEAFE] font-semibold">Diamond</span>.
          </p>

          {isLoggedIn ? (
            <>
              <p className="font-montserrat text-white/50 text-[13px] md:text-[14px] mb-6 md:mb-8">
                Tu plan actual: <span className="text-white font-medium">{currentPlanName || "Free"}</span>
              </p>
              <Link href="/mi-cuenta/suscripcion">
                <button className="w-full sm:w-auto bg-[#00B1DE] text-white px-6 md:px-8 py-2.5 md:py-3 font-montserrat text-[14px] md:text-[16px] font-medium hover:bg-[#00B1DE]/90 transition-colors cursor-pointer">
                  Mejorar mi Plan
                </button>
              </Link>
            </>
          ) : (
            <>
              <p className="font-montserrat text-white/50 text-[13px] md:text-[14px] mb-6 md:mb-8">
                Inicia sesión o regístrate para acceder al foro.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                <Link href="/?login=true" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-[#00B1DE] text-white px-6 md:px-8 py-2.5 md:py-3 font-montserrat text-[14px] md:text-[16px] font-medium hover:bg-[#00B1DE]/90 transition-colors cursor-pointer">
                    Iniciar Sesión
                  </button>
                </Link>
                <Link href="/?register=true" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto border border-white/30 text-white px-6 md:px-8 py-2.5 md:py-3 font-montserrat text-[14px] md:text-[16px] font-medium hover:bg-white/10 transition-colors cursor-pointer">
                    Registrarse
                  </button>
                </Link>
              </div>
            </>
          )}

          {/* Features */}
          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/10">
            <p className="font-montserrat text-white/50 text-[13px] md:text-[14px] mb-3 md:mb-4">
              Con el acceso al foro podrás:
            </p>
            <div className="flex flex-col gap-2 md:gap-3">
              <div className="flex items-center gap-2 md:gap-3 justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00B1DE"
                  strokeWidth="2"
                  className="flex-shrink-0"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="font-montserrat text-white/70 text-[13px] md:text-[14px]">
                  Participar en discusiones con la comunidad
                </span>
              </div>
              <div className="flex items-center gap-2 md:gap-3 justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00B1DE"
                  strokeWidth="2"
                  className="flex-shrink-0"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="font-montserrat text-white/70 text-[13px] md:text-[14px]">
                  Crear temas y responder a otros usuarios
                </span>
              </div>
              <div className="flex items-center gap-2 md:gap-3 justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00B1DE"
                  strokeWidth="2"
                  className="flex-shrink-0"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="font-montserrat text-white/70 text-[13px] md:text-[14px]">
                  Conectar con otros miembros de la comunidad
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
