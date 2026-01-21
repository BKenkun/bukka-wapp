"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { IconPin, IconPinnedOff, IconLock, IconLockOpen, IconTrash } from "@tabler/icons-react"

interface Category {
  id: string
  name: string
  slug: string
}

interface PostModeratorActionsProps {
  postId: string
  isPinned: boolean
  isLocked: boolean
  categoryId: string
  categories: Category[]
  togglePin: () => Promise<void>
  toggleLock: () => Promise<void>
  updateCategory: (formData: FormData) => Promise<void>
  deletePost: () => Promise<void>
}

export function PostModeratorActions({
  postId,
  isPinned,
  isLocked,
  categoryId,
  categories,
  togglePin,
  toggleLock,
  updateCategory,
  deletePost,
}: PostModeratorActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPinning, setIsPinning] = useState(false)
  const [isLocking, setIsLocking] = useState(false)

  const handleTogglePin = async () => {
    setIsPinning(true)
    await togglePin()
    setIsPinning(false)
  }

  const handleToggleLock = async () => {
    setIsLocking(true)
    await toggleLock()
    setIsLocking(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await deletePost()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acciones de Moderación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pin/Unpin */}
        <Button
          variant={isPinned ? "secondary" : "outline"}
          className="w-full justify-start"
          onClick={handleTogglePin}
          disabled={isPinning}
        >
          {isPinned ? (
            <>
              <IconPinnedOff className="mr-2 size-4" />
              {isPinning ? "Quitando fijado..." : "Quitar fijado"}
            </>
          ) : (
            <>
              <IconPin className="mr-2 size-4" />
              {isPinning ? "Fijando..." : "Fijar tema"}
            </>
          )}
        </Button>

        {/* Lock/Unlock */}
        <Button
          variant={isLocked ? "secondary" : "outline"}
          className="w-full justify-start"
          onClick={handleToggleLock}
          disabled={isLocking}
        >
          {isLocked ? (
            <>
              <IconLockOpen className="mr-2 size-4" />
              {isLocking ? "Abriendo..." : "Abrir tema"}
            </>
          ) : (
            <>
              <IconLock className="mr-2 size-4" />
              {isLocking ? "Cerrando..." : "Cerrar tema"}
            </>
          )}
        </Button>

        {/* Change Category */}
        <div>
          <label className="text-sm font-medium mb-2 block">Categoría</label>
          <form action={updateCategory}>
            <div className="flex gap-2">
              <Select name="categoryId" defaultValue={categoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" variant="secondary">
                Cambiar
              </Button>
            </div>
          </form>
        </div>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full justify-start">
              <IconTrash className="mr-2 size-4" />
              Eliminar tema
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente el tema y todas sus respuestas. Esta acción no
                se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
