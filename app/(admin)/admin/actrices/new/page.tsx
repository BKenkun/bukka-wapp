import { PerformerForm } from "../performer-form"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export default function NewPerformerPage() {
  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/actrices">
            <IconArrowLeft className="mr-2 size-4" />
            Volver a Actrices
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Nueva Actriz</h2>
        <p className="text-sm text-muted-foreground">
          Añade una nueva actriz a la plataforma
        </p>
      </div>

      <PerformerForm />
    </div>
  )
}
