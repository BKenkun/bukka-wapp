"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { IconMail, IconMailOpened, IconCheck, IconArchive, IconTrash, IconLoader2 } from "@tabler/icons-react"

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  ipAddress: string | null
  createdAt: string
}

const statusColors: Record<string, string> = {
  UNREAD: "bg-blue-100 text-blue-800",
  READ: "bg-yellow-100 text-yellow-800",
  REPLIED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
}

const statusLabels: Record<string, string> = {
  UNREAD: "Unread",
  READ: "Read",
  REPLIED: "Replied",
  ARCHIVED: "Archived",
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/admin/contact?${params}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
        setTotal(data.total)
      }
    } catch {
      toast.error("Error loading messages")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [statusFilter])

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Marked as ${statusLabels[status]}`)
        fetchMessages()
        if (selectedMessage?.id === id) {
          setSelectedMessage({ ...selectedMessage, status })
        }
      }
    } catch {
      toast.error("Error updating message")
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return
    try {
      const res = await fetch(`/api/admin/contact?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Message deleted")
        setSelectedMessage(null)
        fetchMessages()
      }
    } catch {
      toast.error("Error deleting message")
    }
  }

  const handleSelect = async (msg: ContactMessage) => {
    setSelectedMessage(msg)
    if (msg.status === "UNREAD") {
      await updateStatus(msg.id, "READ")
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact Messages</h1>
          <p className="text-sm text-muted-foreground">{total} messages</p>
        </div>
        <div className="flex gap-2">
          {["", "UNREAD", "READ", "REPLIED", "ARCHIVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s ? statusLabels[s] : "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Message List */}
        <div className="border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No messages
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                    selectedMessage?.id === msg.id ? "bg-muted" : ""
                  } ${msg.status === "UNREAD" ? "font-semibold" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm truncate max-w-[200px]">{msg.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[msg.status]}`}>
                      {statusLabels[msg.status]}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{msg.subject}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">{msg.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(msg.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="border rounded-lg p-6">
          {selectedMessage ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{selectedMessage.subject}</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateStatus(selectedMessage.id, "UNREAD")}
                    className="p-2 hover:bg-muted rounded"
                    title="Mark as unread"
                  >
                    <IconMail className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateStatus(selectedMessage.id, "REPLIED")}
                    className="p-2 hover:bg-muted rounded"
                    title="Mark as replied"
                  >
                    <IconCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateStatus(selectedMessage.id, "ARCHIVED")}
                    className="p-2 hover:bg-muted rounded"
                    title="Archive"
                  >
                    <IconArchive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="p-2 hover:bg-destructive/10 rounded text-destructive"
                    title="Delete"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground w-16">From:</span>
                  <span className="font-medium">{selectedMessage.name}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground w-16">Email:</span>
                  <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground w-16">Date:</span>
                  <span>{formatDate(selectedMessage.createdAt)}</span>
                </div>
                {selectedMessage.ipAddress && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground w-16">IP:</span>
                    <span className="text-muted-foreground">{selectedMessage.ipAddress}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedMessage.message}</p>
              </div>

              <div className="mt-6">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="btn-primary inline-block text-sm"
                  onClick={() => updateStatus(selectedMessage.id, "REPLIED")}
                >
                  Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <IconMailOpened className="w-12 h-12 mb-4 opacity-30" />
              <p>Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
