import { HeaderLogo } from "@/components/header/header-logo"
import { HeaderNav } from "@/components/header/header-nav"
import { HeaderActions } from "@/components/header/header-actions"

export async function MainHeader() {
  return (
    <header className="absolute top-[36px] left-0 w-full z-50 px-4 md:px-8 py-6">
      <div className="grid grid-cols-12 items-center w-full mx-auto gap-4">
        <div className="col-span-6 md:col-span-3 xl:col-span-2 flex justify-start">
          <HeaderLogo />
        </div>

        <div className="hidden lg:flex lg:col-span-6 xl:col-span-8 justify-center">
          <HeaderNav />
        </div>

        <div className="col-span-6 md:col-span-3 xl:col-span-2 flex justify-end">
          <HeaderActions />
        </div>
      </div>
    </header>
  )
}
