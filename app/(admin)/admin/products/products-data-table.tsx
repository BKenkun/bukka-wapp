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
  IconFilter,
  IconAlertTriangle,
  IconShieldCheck,
  IconPackage,
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

interface ProductRow {
  id: string
  slug: string
  name: string
  description: string | null
  price: any
  compareAtPrice: any | null
  sku: string | null
  stock: number
  trackInventory: boolean
  images: string[]
  riskLevel: "LOW_RISK" | "HIGH_RISK"
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  createdAt: Date
  performers: {
    id: string
    name: string
    slug: string
  }[]
  categories: {
    category: {
      id: string
      name: string
      slug: string
    }
  }[]
  _count: {
    orderItems: number
    favorites: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductsDataTableProps {
  products: ProductRow[]
  categories: Category[]
  currentPage: number
  totalPages: number
  totalCount: number
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  ARCHIVED: "Archivado",
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
  ARCHIVED: "bg-red-500/20 text-red-400 border-red-500/30",
}

export function ProductsDataTable({
  products,
  categories,
  currentPage,
  totalPages,
  totalCount,
}: ProductsDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")
  const [deleteProduct, setDeleteProduct] = React.useState<ProductRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const columns: ColumnDef<ProductRow>[] = [
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
      header: "Producto",
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
              {product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IconPackage className="size-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate max-w-[200px]">{product.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {product.sku || "Sin SKU"}
                </p>
                {product.performers.map((performer) => (
                  <Badge key={performer.id} variant="outline" className="text-xs">
                    {performer.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "price",
      header: "Precio",
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="text-sm">
            <p className="font-medium">{Number(product.price).toFixed(2)}€</p>
            {product.compareAtPrice && (
              <p className="text-muted-foreground line-through text-xs">
                {Number(product.compareAtPrice).toFixed(2)}€
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const product = row.original
        if (!product.trackInventory) {
          return <span className="text-muted-foreground">-</span>
        }
        return (
          <Badge
            variant={product.stock > 0 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {product.stock} uds
          </Badge>
        )
      },
    },
    {
      accessorKey: "riskLevel",
      header: "Riesgo",
      cell: ({ row }) => {
        const riskLevel = row.original.riskLevel
        return (
          <Badge
            variant="outline"
            className={
              riskLevel === "HIGH_RISK"
                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                : "bg-green-500/20 text-green-400 border-green-500/30"
            }
          >
            {riskLevel === "HIGH_RISK" ? (
              <>
                <IconAlertTriangle className="mr-1 size-3" />
                High Risk
              </>
            ) : (
              <>
                <IconShieldCheck className="mr-1 size-3" />
                Low Risk
              </>
            )}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
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
      accessorKey: "sales",
      header: "Ventas",
      cell: ({ row }) => {
        const product = row.original
        return (
          <span className="text-sm text-muted-foreground">
            {product._count.orderItems}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const product = row.original
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
                <Link href={`/tienda/${product.slug}`} target="_blank">
                  <IconEye className="mr-2 size-4" />
                  Ver en tienda
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/products/${product.id}`}>
                  <IconEdit className="mr-2 size-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteProduct(product)}
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
    data: products,
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
    router.push(`/admin/products?${params.toString()}`)
  }, [searchValue, searchParams, router])

  const handleStatusFilter = React.useCallback((status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status && status !== "all") {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    params.delete("page")
    router.push(`/admin/products?${params.toString()}`)
  }, [searchParams, router])

  const handleRiskFilter = React.useCallback((risk: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (risk && risk !== "all") {
      params.set("riskLevel", risk)
    } else {
      params.delete("riskLevel")
    }
    params.delete("page")
    router.push(`/admin/products?${params.toString()}`)
  }, [searchParams, router])

  const handleDelete = async () => {
    if (!deleteProduct) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${deleteProduct.slug}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar")
      }

      toast.success("Producto eliminado correctamente")
      router.refresh()
    } catch (error) {
      toast.error("Error al eliminar el producto")
    } finally {
      setIsDeleting(false)
      setDeleteProduct(null)
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
              placeholder="Buscar productos..."
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
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="ARCHIVED">Archivado</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue={searchParams.get("riskLevel") || "all"}
            onValueChange={handleRiskFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Riesgo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="LOW_RISK">Low Risk</SelectItem>
              <SelectItem value="HIGH_RISK">High Risk</SelectItem>
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
                      {column.id === "name" ? "Producto" : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                  No se encontraron productos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {(currentPage - 1) * 20 + 1} -{" "}
          {Math.min(currentPage * 20, totalCount)} de {totalCount}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("page", String(currentPage - 1))
              router.push(`/admin/products?${params.toString()}`)
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
              router.push(`/admin/products?${params.toString()}`)
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto &quot;{deleteProduct?.name}&quot;
              será eliminado permanentemente.
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
