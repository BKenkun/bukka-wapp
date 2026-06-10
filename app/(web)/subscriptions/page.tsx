import { redirect } from "next/navigation"

export default function SubscriptionsPage() {
  // /suscripciones decide: visitantes ven los planes públicos,
  // usuarios logueados van a su cuenta
  redirect("/suscripciones")
}
