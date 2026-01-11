"use client"

import { Search, X, LogOut } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CartButton } from "@/components/cart/cart-button"
import { LoginModal } from "@/components/auth/login-modal"

export function HeaderActions() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { data: session, status } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <>
      <div className="flex items-center justify-end w-full">
        {/* Desktop search bar */}
        <div className="relative hidden xl:flex w-[320px] h-10 bg-zinc-400/40 items-center px-4 mr-[40px]">
          <input
            type="text"
            placeholder="Busca"
            className="bg-transparent border-none outline-none text-white placeholder-white/70 w-full font-['Montserrat'] font-bold text-sm"
          />
          <Search className="w-5 h-5 text-white shrink-0" />
        </div>

        <div className="flex items-center gap-[11px]">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="xl:hidden p-1 hover:opacity-80 transition-opacity text-white"
          >
            <Search className="w-5 h-5" />
          </button>

          {status === "loading" ? (
            <div className="w-5 h-5 rounded-full bg-zinc-400/40 animate-pulse" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:opacity-80 transition-opacity text-white">
                  <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19.4082 17.6276C17.9803 15.1591 15.78 13.3891 13.2122 12.5501C14.4824 11.7939 15.4692 10.6417 16.0212 9.27048C16.5731 7.89922 16.6597 6.38468 16.2676 4.95945C15.8755 3.53422 15.0264 2.27711 13.8506 1.38117C12.6749 0.485228 11.2376 0 9.75941 0C8.28122 0 6.84391 0.485228 5.66818 1.38117C4.49246 2.27711 3.64334 3.53422 3.25123 4.95945C2.85911 6.38468 2.94569 7.89922 3.49765 9.27048C4.04961 10.6417 5.03644 11.7939 6.3066 12.5501C3.73878 13.3882 1.53847 15.1582 0.110659 17.6276C0.0582987 17.7129 0.0235684 17.8079 0.00851736 17.9069C-0.00653367 18.006 -0.00160057 18.107 0.0230256 18.2041C0.0476518 18.3011 0.0914723 18.3923 0.151901 18.4722C0.212331 18.552 0.288144 18.619 0.37487 18.6691C0.461595 18.7192 0.557476 18.7514 0.656854 18.7638C0.756232 18.7763 0.857095 18.7687 0.953492 18.7415C1.04989 18.7143 1.13987 18.6681 1.21812 18.6056C1.29637 18.5431 1.3613 18.4656 1.4091 18.3776C3.17535 15.3251 6.29722 13.5026 9.75941 13.5026C13.2216 13.5026 16.3435 15.3251 18.1097 18.3776C18.1575 18.4656 18.2225 18.5431 18.3007 18.6056C18.379 18.6681 18.4689 18.7143 18.5653 18.7415C18.6617 18.7687 18.7626 18.7763 18.862 18.7638C18.9613 18.7514 19.0572 18.7192 19.1439 18.6691C19.2307 18.619 19.3065 18.552 19.3669 18.4722C19.4273 18.3923 19.4712 18.3011 19.4958 18.2041C19.5204 18.107 19.5254 18.006 19.5103 17.9069C19.4952 17.8079 19.4605 17.7129 19.4082 17.6276ZM4.50941 6.75255C4.50941 5.7142 4.81732 4.69917 5.39419 3.83581C5.97107 2.97245 6.79101 2.29954 7.75032 1.90218C8.70963 1.50482 9.76523 1.40086 10.7836 1.60343C11.802 1.806 12.7375 2.30601 13.4717 3.04024C14.2059 3.77447 14.706 4.70993 14.9085 5.72833C15.1111 6.74673 15.0071 7.80233 14.6098 8.76164C14.2124 9.72095 13.5395 10.5409 12.6762 11.1178C11.8128 11.6946 10.7978 12.0026 9.75941 12.0026C8.36748 12.0011 7.03299 11.4475 6.04874 10.4632C5.0645 9.47897 4.5109 8.14448 4.50941 6.75255Z"
                      fill="white"
                    />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-black border-zinc-800">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-white">{session.user.name || "Usuario"}</p>
                  <p className="text-xs text-zinc-400">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem asChild className="text-white focus:bg-zinc-800 focus:text-white">
                  <Link href="/mi-cuenta">Mi cuenta</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-white focus:bg-zinc-800 focus:text-white">
                  <Link href="/mi-cuenta/favoritos">Favoritos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-white focus:bg-zinc-800 focus:text-white">
                  <Link href="/mi-cuenta/configuracion">Configuración</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={handleSignOut} className="text-[#FA4860] focus:bg-zinc-800 focus:text-[#FA4860]">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="hover:opacity-80 transition-opacity text-white"
            >
              <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19.4082 17.6276C17.9803 15.1591 15.78 13.3891 13.2122 12.5501C14.4824 11.7939 15.4692 10.6417 16.0212 9.27048C16.5731 7.89922 16.6597 6.38468 16.2676 4.95945C15.8755 3.53422 15.0264 2.27711 13.8506 1.38117C12.6749 0.485228 11.2376 0 9.75941 0C8.28122 0 6.84391 0.485228 5.66818 1.38117C4.49246 2.27711 3.64334 3.53422 3.25123 4.95945C2.85911 6.38468 2.94569 7.89922 3.49765 9.27048C4.04961 10.6417 5.03644 11.7939 6.3066 12.5501C3.73878 13.3882 1.53847 15.1582 0.110659 17.6276C0.0582987 17.7129 0.0235684 17.8079 0.00851736 17.9069C-0.00653367 18.006 -0.00160057 18.107 0.0230256 18.2041C0.0476518 18.3011 0.0914723 18.3923 0.151901 18.4722C0.212331 18.552 0.288144 18.619 0.37487 18.6691C0.461595 18.7192 0.557476 18.7514 0.656854 18.7638C0.756232 18.7763 0.857095 18.7687 0.953492 18.7415C1.04989 18.7143 1.13987 18.6681 1.21812 18.6056C1.29637 18.5431 1.3613 18.4656 1.4091 18.3776C3.17535 15.3251 6.29722 13.5026 9.75941 13.5026C13.2216 13.5026 16.3435 15.3251 18.1097 18.3776C18.1575 18.4656 18.2225 18.5431 18.3007 18.6056C18.379 18.6681 18.4689 18.7143 18.5653 18.7415C18.6617 18.7687 18.7626 18.7763 18.862 18.7638C18.9613 18.7514 19.0572 18.7192 19.1439 18.6691C19.2307 18.619 19.3065 18.552 19.3669 18.4722C19.4273 18.3923 19.4712 18.3011 19.4958 18.2041C19.5204 18.107 19.5254 18.006 19.5103 17.9069C19.4952 17.8079 19.4605 17.7129 19.4082 17.6276ZM4.50941 6.75255C4.50941 5.7142 4.81732 4.69917 5.39419 3.83581C5.97107 2.97245 6.79101 2.29954 7.75032 1.90218C8.70963 1.50482 9.76523 1.40086 10.7836 1.60343C11.802 1.806 12.7375 2.30601 13.4717 3.04024C14.2059 3.77447 14.706 4.70993 14.9085 5.72833C15.1111 6.74673 15.0071 7.80233 14.6098 8.76164C14.2124 9.72095 13.5395 10.5409 12.6762 11.1178C11.8128 11.6946 10.7978 12.0026 9.75941 12.0026C8.36748 12.0011 7.03299 11.4475 6.04874 10.4632C5.0645 9.47897 4.5109 8.14448 4.50941 6.75255Z"
                  fill="white"
                />
              </svg>
            </button>
          )}

          <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />

          <CartButton />
        </div>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-2xl">
            <div className="relative flex w-full h-12 bg-zinc-400/40 items-center px-4">
              <input
                type="text"
                placeholder="Busca"
                autoFocus
                className="bg-transparent border-none outline-none text-white placeholder-white/70 w-full font-['Montserrat'] font-bold text-base"
              />
              <Search className="w-5 h-5 text-white shrink-0 mr-4" />
              <button onClick={() => setIsSearchOpen(false)} className="hover:opacity-80 transition-opacity text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
