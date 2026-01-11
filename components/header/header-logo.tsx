import Link from "next/link"

export function HeaderLogo() {
  return (
    <Link href="/" className="block">
      <h1 className="text-white text-2xl lg:text-3xl font-[900] tracking-tight font-['Montserrat']">BUKKAKERY</h1>
    </Link>
  )
}
