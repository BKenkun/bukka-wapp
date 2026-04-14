import { redirect } from "next/navigation"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const params = await searchParams
  const callbackUrl = params.callbackUrl

  if (callbackUrl) {
    redirect(`/?login=true&callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  redirect("/?login=true")
}
