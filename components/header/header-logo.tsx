import Link from "next/link"

export function HeaderLogo() {
  return (
    <Link href="/" className="block">
      <h1
        className="text-2xl lg:text-3xl font-[900] tracking-tight"
        style={{ color: "var(--text-primary)", fontFamily: "var(--global-font)" }}
      >
        BUKKAKERY
      </h1>
    </Link>
  )
}
