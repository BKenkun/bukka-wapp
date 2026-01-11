import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { PageForm } from "../page-form"

export default function NewPagePage() {
  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/pages">
            <IconArrowLeft className="mr-2 size-4" />
            Volver a Páginas
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">Nueva Página</h2>
        <p className="text-sm text-muted-foreground">
          Crea una nueva página estática o aviso legal
        </p>
      </div>

      <PageForm />
    </div>
  )
}
