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
  IconVideo,
  IconHeart,
  IconCheck,
  IconArrowsSort,
} from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface PerformerRow {
  id: string
  slug: string
  name: string
  bio: string | null
  profileImage: string | null
  verified: boolean
  createdAt: Date
  _count: {
    VideoPerformer: number
    favorites: number
    products: number
  }
  User: {
    id: string
    name: string | null
    email: string
  } | null
}

interface PerformersDataTableProps {
  performers: PerformerRow[]
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

export function PerformersDataTable({
  performers,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: PerformersDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")
  const [deletePerformer, setDeletePerformer] = React.useState<PerformerRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const columns: ColumnDef<PerformerRow>[] = [
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
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Actriz
          <IconArrowsSort className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const performer = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={performer.profileImage || undefined} alt={performer.name} />
              <AvatarFallback>{performer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{performer.name}</p>
                {performer.verified && (
                  <Badge variant="secondary" className="text-xs bg-[#00aaff]/10 text-[#00aaff] border-[#00aaff]/20">
                    <IconCheck className="mr-1 size-3" />
                    Verificada
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                /{performer.slug}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "stats",
      header: "Stats",
      cell: ({ row }) => {
        const performer = row.original
        return (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <IconVideo className="size-4 text-muted-foreground" />
              <span>{performer._count.VideoPerformer}</span>
            </div>
            <div className="flex items-center gap-1">
              <IconHeart className="size-4 text-muted-foreground" />
              <span>{performer._count.favorites}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
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
        const date = new Date(row.original.createdAt)
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
        const performer = row.original
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
                <Link href={`/modelos/${performer.slug}`} target="_blank">
                  <IconEye className="mr-2 size-4" />
                  Ver perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/actrices/${performer.id}`}>
                  <IconEdit className="mr-2 size-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeletePerformer(performer)}
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
    data: performers,
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
    router.push(`/admin/actrices?${params.toString()}`)
  }, [searchValue, searchParams, router])

  const handleDelete = async () => {
    if (!deletePerformer) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/performers/${deletePerformer.slug}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar")
      }

      toast.success("Actriz eliminada correctamente")
      router.refresh()
    } catch (error) {
      toast.error("Error al eliminar la actriz")
    } finally {
      setIsDeleting(false)
      setDeletePerformer(null)
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
              placeholder="Buscar actrices..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

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
                    {column.id === "name" ? "Actriz" : column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
                  No se encontraron actrices
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
                router.push(`/admin/actrices?${params.toString()}`)
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
              router.push(`/admin/actrices?${params.toString()}`)
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
              router.push(`/admin/actrices?${params.toString()}`)
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletePerformer} onOpenChange={() => setDeletePerformer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar actriz?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La actriz &quot;{deletePerformer?.name}&quot;
              será eliminada permanentemente junto con todos sus datos asociados.
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
