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
  IconSearch,
  IconMail,
  IconShield,
  IconBan,
  IconCrown,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SubscriptionPlan {
  id: string
  slug: string
  name: string
  color: string | null
}

interface UserRow {
  id: string
  name: string | null
  email: string
  username: string | null
  image: string | null
  subscriptionPlanId: string | null
  subscriptionPlan: SubscriptionPlan | null
  subscriptionEnd: Date | null
  isAdmin: boolean
  isPerformer: boolean
  isVerified: boolean
  createdAt: Date
  _count: {
    orders: number
    favorites: number
    comments: number
  }
  badges: {
    badge: {
      id: string
      name: string
      slug: string
      color: string | null
    }
  }[]
}

interface UsersDataTableProps {
  users: UserRow[]
  currentPage: number
  totalPages: number
  totalCount: number
  plans: SubscriptionPlan[]
}

export function UsersDataTable({
  users,
  currentPage,
  totalPages,
  totalCount,
  plans,
}: UsersDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "")

  const columns: ColumnDef<UserRow>[] = [
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
      header: "Usuario",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
              <AvatarFallback>
                {(user.name || user.email).substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{user.name || "Sin nombre"}</p>
                {user.isAdmin && (
                  <IconShield className="size-4 text-red-500" />
                )}
                {user.isPerformer && (
                  <IconCrown className="size-4 text-pink-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "subscriptionPlan",
      header: "Suscripción",
      cell: ({ row }) => {
        const user = row.original
        const isExpired = user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date()
        const planColor = user.subscriptionPlan?.color || "#6B7280"
        return (
          <div className="space-y-1">
            <Badge
              variant="outline"
              style={{
                borderColor: planColor,
                color: planColor,
                backgroundColor: `${planColor}20`,
              }}
            >
              {user.subscriptionPlan?.name || "Sin plan"}
            </Badge>
            {user.subscriptionEnd && (
              <p className={`text-xs ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                {isExpired ? "Expirado" : `Expira: ${new Date(user.subscriptionEnd).toLocaleDateString("es-ES")}`}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "badges",
      header: "Badges",
      cell: ({ row }) => {
        const badges = row.original.badges
        if (badges.length === 0) return <span className="text-muted-foreground">-</span>
        return (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {badges.slice(0, 3).map((ub) => (
              <Badge
                key={ub.badge.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: ub.badge.color || undefined }}
              >
                {ub.badge.name}
              </Badge>
            ))}
            {badges.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{badges.length - 3}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "activity",
      header: "Actividad",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="text-sm text-muted-foreground">
            <p>{user._count.orders} pedidos</p>
            <p>{user._count.comments} comentarios</p>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Registro",
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
        const user = row.original
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
                <Link href={`/admin/users/${user.id}`}>
                  <IconEdit className="mr-2 size-4" />
                  Ver/Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconMail className="mr-2 size-4" />
                Enviar email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <IconBan className="mr-2 size-4" />
                Suspender cuenta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: users,
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
    router.push(`/admin/users?${params.toString()}`)
  }, [searchValue, searchParams, router])

  const handlePlanFilter = React.useCallback((planId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (planId && planId !== "all") {
      params.set("planId", planId)
    } else {
      params.delete("planId")
    }
    params.delete("page")
    router.push(`/admin/users?${params.toString()}`)
  }, [searchParams, router])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
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
            defaultValue={searchParams.get("planId") || "all"}
            onValueChange={handlePlanFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los planes</SelectItem>
              <SelectItem value="none">Sin plan</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
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
                      {column.id === "name" ? "Usuario" : column.id}
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
                  No se encontraron usuarios
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
              router.push(`/admin/users?${params.toString()}`)
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
              router.push(`/admin/users?${params.toString()}`)
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
