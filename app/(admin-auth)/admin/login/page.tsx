import { LoginForm } from "@/components/login-form"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminLoginPage() {
  // Si ya está autenticado como admin, redirigir al dashboard
  const session = await auth()
  if (session?.user?.isAdmin) {
    redirect("/admin")
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-black">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-white text-2xl lg:text-3xl font-[900] tracking-tight font-['Montserrat']">
              Bukkakery
            </span>
            <span className="text-[10px] bg-[#FA4860] text-white px-1.5 py-0.5 rounded font-bold">
              ADMIN
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm showRegisterLink={false} showForgotPassword={false} />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/images/background.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
