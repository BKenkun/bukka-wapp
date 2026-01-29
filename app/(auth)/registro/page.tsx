import { redirect } from "next/navigation"

export default function RegisterPage() {
  // Redirect to home with register modal open
  redirect("/?register=true")
}
