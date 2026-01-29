"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Eye, Clock, TrendingUp, ThumbsUp, MessageCircle, Star } from "lucide-react"
import { toast } from "sonner"

interface SystemCollection {
  id: string
  type: string
  slug: string
  name: string
  description: string | null
  imageUrl: string | null
  isEnabled: boolean
  order: number
}

const COLLECTION_ICONS: Record<string, React.ReactNode> = {
  MAS_VISTOS: <Eye className="w-5 h-5" />,
  NUEVOS: <Clock className="w-5 h-5" />,
  TENDENCIAS: <TrendingUp className="w-5 h-5" />,
  MEJOR_VALORADOS: <ThumbsUp className="w-5 h-5" />,
  MAS_COMENTADOS: <MessageCircle className="w-5 h-5" />,
  RECOMENDADOS: <Star className="w-5 h-5" />,
}

const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  MAS_VISTOS: "Ordena los vídeos por número total de reproducciones",
  NUEVOS: "Ordena los vídeos por fecha de publicación (más recientes primero)",
  TENDENCIAS: "Vídeos más vistos en los últimos 7 días",
  MEJOR_VALORADOS: "Ordena los vídeos por número de likes",
  MAS_COMENTADOS: "Ordena los vídeos por número de comentarios",
  RECOMENDADOS: "Combinación de vistas, likes y recencia",
}

export function SystemCollectionsSettings() {
  const [collections, setCollections] = useState<SystemCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/admin/system-collections")
      if (res.ok) {
        const data = await res.json()
        setCollections(data)
      }
    } catch (error) {
      console.error("Error fetching collections:", error)
      toast.error("Error al cargar las colecciones")
    } finally {
      setLoading(false)
    }
  }

  const toggleCollection = async (id: string, isEnabled: boolean) => {
    setSaving(id)
    try {
      const res = await fetch("/api/admin/system-collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isEnabled }),
      })

      if (res.ok) {
        setCollections((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isEnabled } : c))
        )
        toast.success(isEnabled ? "Colección activada" : "Colección desactivada")
      } else {
        toast.error("Error al actualizar la colección")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al actualizar la colección")
    } finally {
      setSaving(null)
    }
  }

  const saveCollection = async (collection: SystemCollection) => {
    setSaving(collection.id)
    try {
      const res = await fetch("/api/admin/system-collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: collection.id,
          name: collection.name,
          description: collection.description,
        }),
      })

      if (res.ok) {
        toast.success("Colección guardada")
        setEditingId(null)
      } else {
        toast.error("Error al guardar la colección")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al guardar la colección")
    } finally {
      setSaving(null)
    }
  }

  const updateLocalCollection = (id: string, field: string, value: string) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Colecciones del Sistema</CardTitle>
        <CardDescription>
          Activa o desactiva las colecciones automáticas de vídeos. Estas aparecerán
          disponibles en el megamenu y tendrán URLs como /videos/mas-vistos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className={`border rounded-lg p-4 ${!collection.isEnabled ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {COLLECTION_ICONS[collection.type] || <Eye className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-medium">{collection.name}</div>
                  <div className="text-sm text-muted-foreground">
                    /videos/{collection.slug}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {saving === collection.id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <Switch
                  checked={collection.isEnabled}
                  onCheckedChange={(checked) =>
                    toggleCollection(collection.id, checked)
                  }
                  disabled={saving === collection.id}
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              {COLLECTION_DESCRIPTIONS[collection.type]}
            </p>

            {editingId === collection.id ? (
              <div className="space-y-3 mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Nombre personalizado</Label>
                  <Input
                    value={collection.name}
                    onChange={(e) =>
                      updateLocalCollection(collection.id, "name", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={collection.description || ""}
                    onChange={(e) =>
                      updateLocalCollection(
                        collection.id,
                        "description",
                        e.target.value
                      )
                    }
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => saveCollection(collection)}
                    disabled={saving === collection.id}
                  >
                    {saving === collection.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                      fetchCollections()
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="link"
                size="sm"
                className="mt-2 p-0 h-auto"
                onClick={() => setEditingId(collection.id)}
              >
                Personalizar nombre
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
