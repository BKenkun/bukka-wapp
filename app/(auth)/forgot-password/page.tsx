import { redirect } from "next/navigation"

export default function ForgotPasswordPage() {
  // Redirect to home with forgot password modal open
  redirect("/?forgot-password=true")
}
