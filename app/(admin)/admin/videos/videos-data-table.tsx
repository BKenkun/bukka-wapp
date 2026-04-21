"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  IconChevronDown,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconSearch,
  IconTrash,
  IconDiamond,
  IconClock,
  IconFilter,
  IconArrowsSort,
} from "@tabler/icons-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface VideoRow {
  id: string
  slug: string
  title: string
  thumbnailUrl: string
  duration: number
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED"
  minTier: string
  isDiamondExclusive: boolean
  isLimitedEdition: boolean
  viewCount: number
  likeCount: number
  releaseDate: Date
  createdAt: Date
  performers: {
    performer: {
      id: string
      name: string
      slug: string
    }
  }[]
  categories: {
    category: {
      id: string
      name: string
      slug: string
    }
  }[]
  _count: {
    comments: number
    favorites: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

interface VideosDataTableProps {
  videos: VideoRow[]
  categories: Category[]
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  SCHEDULED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUBLISHED: "bg-green-500/20 text-green-400 border-green-500/30",
  ARCHIVED: "bg-red-500/20 text-red-400 border-red-500/30",
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function VideosDataTable({
  videos,
  categories,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: VideosDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")
  const [deleteVideo, setDeleteVideo] = React.useState<VideoRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isSyncingDuration, setIsSyncingDuration] = React.useState(false)

  const columns: ColumnDef<VideoRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todo"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Video
          <IconArrowsSort className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const video = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Sin imagen
                </div>
              )}
              {video.duration > 0 && (
                <span className="absolute bottom-1 right-1 px-1 text-[10px] bg-black/80 text-white rounded">
                  {formatDuration(video.duration)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate max-w-[200px]">{video.title}</p>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                /{video.slug}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "performers",
      header: "Actrices",
      cell: ({ row }) => {
        const performers = row.original.performers
        if (performers.length === 0) return <span className="text-muted-foreground">-</span>
        return (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {performers.slice(0, 2).map((vp) => (
              <Badge key={vp.performer.id} variant="secondary" className="text-xs">
                {vp.performer.name}
              </Badge>
            ))}
            {performers.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{performers.length - 2}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Estado
          <IconArrowsSort className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant="outline" className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        )
      },
    },
    {
      accessorKey: "minTier",
      header: "Acceso",
      cell: ({ row }) => {
        const video = row.original
        return (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {video.minTier}
            </Badge>
            {video.isDiamondExclusive && (
              <IconDiamond className="size-4 text-cyan-400" />
            )}
            {video.isLimitedEdition && (
              <IconClock className="size-4 text-purple-400" />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "viewCount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Stats
          <IconArrowsSort className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const video = row.original
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <IconEye className="size-3 text-muted-foreground" />
              <span>{video.viewCount.toLocaleString()}</span>
            </div>
            <div className="text-muted-foreground text-xs">
              {video._count.favorites} favs
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "releaseDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Fecha
          <IconArrowsSort className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.releaseDate)
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const video = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/videos/${video.slug}`} target="_blank">
                  <IconEye className="mr-2 size-4" />
                  Ver en sitio
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/videos/${video.id}`}>
                  <IconEdit className="mr-2 size-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteVideo(video)}
              >
                <IconTrash className="mr-2 size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: videos,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleSearch = React.useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set("search", searchValue)
    } else {
      params.delete("search")
    }
    params.delete("page")
    router.push(`/admin/videos?${params.toString()}`)
  }, [searchValue, searchParams, router])

  const handleStatusFilter = React.useCallback((status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status && status !== "all") {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    params.delete("page")
    router.push(`/admin/videos?${params.toString()}`)
  }, [searchParams, router])

  const handleDelete = async () => {
    if (!deleteVideo) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/videos/${deleteVideo.slug}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar")
      }

      toast.success("Video eliminado correctamente")
      router.refresh()
    } catch (error) {
      toast.error("Error al eliminar el video")
    } finally {
      setIsDeleting(false)
      setDeleteVideo(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar videos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        <div className="flex gap-2">
          <Select
            defaultValue={searchParams.get("status") || "all"}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-[160px]">
              <IconFilter className="mr-2 size-4" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="SCHEDULED">Programado</SelectItem>
              <SelectItem value="PUBLISHED">Publicado</SelectItem>
              <SelectItem value="ARCHIVED">Archivado</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            disabled={isSyncingDuration}
            onClick={async () => {
              setIsSyncingDuration(true)
              try {
                const res = await fetch("/api/admin/videos/sync-duration", {
                  method: "POST",
                })
                const data = await res.json()
                if (!res.ok) {
                  toast.error(data.error || "Error al sincronizar")
                } else if (data.total === 0) {
                  toast.info("Todas las duraciones están sincronizadas")
                } else {
                  toast.success(
                    `${data.updated}/${data.total} duraciones actualizadas` +
                      (data.errors.length ? ` · ${data.errors.length} errores` : "")
                  )
                  router.refresh()
                }
              } catch {
                toast.error("Error al sincronizar duraciones")
              } finally {
                setIsSyncingDuration(false)
              }
            }}
          >
            {isSyncingDuration ? "Sincronizando..." : "Sincronizar duraciones"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columnas
                <IconChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id === "title" ? "Vídeo" : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Selected actions */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {Object.keys(rowSelection).length} seleccionados
          </span>
          <Button variant="destructive" size="sm">
            Eliminar seleccionados
          </Button>
          <Button variant="outline" size="sm">
            Cambiar estado
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron videos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, totalCount)} de {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Por página:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                const params = new URLSearchParams(searchParams.toString())
                params.set("pageSize", value)
                params.delete("page")
                router.push(`/admin/videos?${params.toString()}`)
              }}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("page", String(currentPage - 1))
              router.push(`/admin/videos?${params.toString()}`)
            }}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("page", String(currentPage + 1))
              router.push(`/admin/videos?${params.toString()}`)
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteVideo} onOpenChange={() => setDeleteVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar video?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El video &quot;{deleteVideo?.title}&quot;
              será eliminado permanentemente junto con todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
