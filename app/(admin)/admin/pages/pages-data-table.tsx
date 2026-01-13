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
  IconFile,
  IconArrowsSort,
  IconCheck,
  IconClock,
  IconArchive,
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

interface PageRow {
  id: string
  slug: string
  title: string
  metaTitle: string | null
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  createdAt: Date
  updatedAt: Date
}

interface PagesDataTableProps {
  pages: PageRow[]
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

const statusConfig = {
  DRAFT: { label: "Borrador", icon: IconClock, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  PUBLISHED: { label: "Publicada", icon: IconCheck, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  ARCHIVED: { label: "Archivada", icon: IconArchive, color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
}

export function PagesDataTable({
  pages,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: PagesDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")
  const [deletePage, setDeletePage] = React.useState<PageRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const columns: ColumnDef<PageRow>[] = [
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
          Título
          <IconArrowsSort className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const page = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded bg-muted flex items-center justify-center">
              <IconFile className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{page.title}</p>
              {page.metaTitle && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {page.metaTitle}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          /{row.original.slug}
        </span>
      ),
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
        const status = statusConfig[row.original.status]
        const StatusIcon = status.icon
        return (
          <Badge variant="outline" className={status.color}>
            <StatusIcon className="size-3 mr-1" />
            {status.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Actualizada
          <IconArrowsSort className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.updatedAt)
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
        const page = row.original
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
              {page.status === "PUBLISHED" && (
                <DropdownMenuItem asChild>
                  <Link href={`/p/${page.slug}`} target="_blank">
                    <IconEye className="mr-2 size-4" />
                    Ver página
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/admin/pages/${page.id}`}>
                  <IconEdit className="mr-2 size-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeletePage(page)}
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
    data: pages,
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
    router.push(`/admin/pages?${params.toString()}`)
  }, [searchValue, searchParams, router])

  const handleStatusFilter = React.useCallback((status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status && status !== "all") {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    params.delete("page")
    router.push(`/admin/pages?${params.toString()}`)
  }, [searchParams, router])

  const handleDelete = async () => {
    if (!deletePage) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/pages/${deletePage.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar")
      }

      toast.success("Página eliminada correctamente")
      router.refresh()
    } catch (error) {
      toast.error("Error al eliminar la página")
    } finally {
      setIsDeleting(false)
      setDeletePage(null)
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
              placeholder="Buscar páginas..."
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
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="PUBLISHED">Publicada</SelectItem>
              <SelectItem value="ARCHIVED">Archivada</SelectItem>
            </SelectContent>
          </Select>

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
                      {column.id === "title" ? "Título" : column.id}
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
                  No se encontraron páginas
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
                router.push(`/admin/pages?${params.toString()}`)
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
              router.push(`/admin/pages?${params.toString()}`)
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
              router.push(`/admin/pages?${params.toString()}`)
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletePage} onOpenChange={() => setDeletePage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar página?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La página &quot;{deletePage?.title}&quot;
              será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
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
    </div>
  )
}
