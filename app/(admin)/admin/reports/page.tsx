"use client"

import { useState, useEffect, useCallback } from "react"

interface ReportedContent {
  title: string | null
  content: string | null
  author: string | null
}

interface Report {
  id: string
  itemType: string
  itemId: string
  reason: string
  message: string | null
  status: string
  adminNotes: string | null
  createdAt: string
  reporter: { id: string; name: string | null; email: string; image: string | null }
  reportedContent: ReportedContent | null
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "#F59E0B", bg: "#FEF3C7" },
  REVIEWING: { label: "En revisión", color: "#3B82F6", bg: "#DBEAFE" },
  RESOLVED: { label: "Resuelto", color: "#10B981", bg: "#D1FAE5" },
  DISMISSED: { label: "Descartado", color: "#6B7280", bg: "#F3F4F6" },
}

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  HARASSMENT: "Acoso",
  INAPPROPRIATE: "Contenido inapropiado",
  MISINFORMATION: "Desinformación",
  OTHER: "Otro",
}

const TYPE_LABELS: Record<string, string> = {
  FORUM_POST: "Post del foro",
  FORUM_REPLY: "Respuesta del foro",
  VIDEO_COMMENT: "Comentario de vídeo",
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState("")

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/admin/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      console.error("Error fetching reports:", err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const updateStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(adminNotes !== undefined && { adminNotes }) }),
      })
      if (res.ok) {
        fetchReports()
        setEditingId(null)
      }
    } catch (err) {
      console.error("Error updating report:", err)
    }
  }

  const deleteReport = async (id: string) => {
    if (!confirm("¿Eliminar este reporte?")) return
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" })
      if (res.ok) fetchReports()
    } catch (err) {
      console.error("Error deleting report:", err)
    }
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground text-sm">{total} reportes en total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["", "PENDING", "REVIEWING", "RESOLVED", "DISMISSED"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s ? STATUS_LABELS[s]?.label : "Todos"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay reportes</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Reportado por</th>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Motivo</th>
                <th className="text-left p-3 font-medium">Contenido reportado</th>
                <th className="text-left p-3 font-medium">Estado</th>
                <th className="text-left p-3 font-medium">Fecha</th>
                <th className="text-left p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {report.reporter.image ? (
                        <img src={report.reporter.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                          {report.reporter.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                      <span className="truncate max-w-[120px]">{report.reporter.name || report.reporter.email}</span>
                    </div>
                  </td>
                  <td className="p-3">{TYPE_LABELS[report.itemType] || report.itemType}</td>
                  <td className="p-3">{REASON_LABELS[report.reason] || report.reason}</td>
                  <td className="p-3 max-w-[300px]">
                    {report.reportedContent ? (
                      <div>
                        {report.reportedContent.title && (
                          <p className="font-medium text-xs truncate">{report.reportedContent.title}</p>
                        )}
                        <p className="text-muted-foreground text-xs truncate">&quot;{report.reportedContent.content}&quot;</p>
                        {report.reportedContent.author && (
                          <p className="text-muted-foreground text-[10px] mt-0.5">por {report.reportedContent.author}</p>
                        )}
                        {report.message && (
                          <p className="text-[10px] mt-1 italic text-muted-foreground">Nota: {report.message}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Contenido eliminado</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        color: STATUS_LABELS[report.status]?.color,
                        backgroundColor: STATUS_LABELS[report.status]?.bg,
                      }}
                    >
                      {STATUS_LABELS[report.status]?.label || report.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {report.status === "PENDING" && (
                        <button
                          onClick={() => updateStatus(report.id, "REVIEWING")}
                          className="text-blue-500 hover:text-blue-400 text-xs cursor-pointer px-1"
                          title="Marcar en revisión"
                        >
                          Revisar
                        </button>
                      )}
                      {(report.status === "PENDING" || report.status === "REVIEWING") && (
                        <>
                          <button
                            onClick={() => updateStatus(report.id, "RESOLVED")}
                            className="text-green-500 hover:text-green-400 text-xs cursor-pointer px-1"
                            title="Resolver"
                          >
                            Resolver
                          </button>
                          <button
                            onClick={() => updateStatus(report.id, "DISMISSED")}
                            className="text-gray-500 hover:text-gray-400 text-xs cursor-pointer px-1"
                            title="Descartar"
                          >
                            Descartar
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(editingId === report.id ? null : report.id)
                          setEditNotes(report.adminNotes || "")
                        }}
                        className="text-yellow-500 hover:text-yellow-400 text-xs cursor-pointer px-1"
                        title="Notas"
                      >
                        Notas
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="text-red-500 hover:text-red-400 text-xs cursor-pointer px-1"
                        title="Eliminar"
                      >
                        Eliminar
                      </button>
                    </div>
                    {editingId === report.id && (
                      <div className="mt-2 flex gap-2">
                        <input
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notas de admin..."
                          className="flex-1 text-xs border rounded px-2 py-1 bg-background"
                        />
                        <button
                          onClick={() => updateStatus(report.id, report.status, editNotes)}
                          className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded cursor-pointer"
                        >
                          Guardar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded border disabled:opacity-50 cursor-pointer"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded border disabled:opacity-50 cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
