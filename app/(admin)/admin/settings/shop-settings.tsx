"use client"

import * as React from "react"
import { IconLoader2, IconX, IconPhoto } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { LocalUploadDropzone } from "@/components/local-upload-button"
import Image from "next/image"

interface ShopSettingsData {
  banner: {
    imageUrl: string | null
    alt: string
  }
}

export function ShopSettings() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  // Banner
  const [bannerImageUrl, setBannerImageUrl] = React.useState<string | null>(null)
  const [bannerAlt, setBannerAlt] = React.useState("Tienda")

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/shop")
      if (response.ok) {
        const data = await response.json()
        const settings: ShopSettingsData = data.settings

        // Banner
        setBannerImageUrl(settings.banner?.imageUrl || null)
        setBannerAlt(settings.banner?.alt || "Tienda")
      }
    } catch (error) {
      console.error("Error loading shop settings:", error)
      toast.error("Error al cargar la configuración")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const settings: ShopSettingsData = {
        banner: {
          imageUrl: bannerImageUrl,
          alt: bannerAlt,
        },
      }

      const response = await fetch("/api/admin/settings/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Configuración guardada")
      } else {
        toast.error("Error al guardar")
      }
    } catch (error) {
      console.error("Error saving shop settings:", error)
      toast.error("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <Card>
        <CardHeader>
          <CardTitle>Banner de la Tienda</CardTitle>
          <CardDescription>
            Imagen que aparece en la parte superior de la página /tienda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bannerImageUrl ? (
            <div className="relative">
              <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={bannerImageUrl}
                  alt={bannerAlt}
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setBannerImageUrl(null)}
              >
                <IconX className="size-4" />
              </Button>
            </div>
          ) : (
            <LocalUploadDropzone
              folder="shop"
              accept="image/*"
              onUploadComplete={(result) => {
                setBannerImageUrl(result.url)
                toast.success("Imagen subida correctamente")
              }}
              onUploadError={(error) => {
                toast.error(error.message)
              }}
            >
              <div className="flex flex-col items-center gap-2 py-8">
                <IconPhoto className="size-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arrastra una imagen aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Recomendado: 1920x823px (ratio 21:9)
                </p>
              </div>
            </LocalUploadDropzone>
          )}

          <div className="space-y-2">
            <Label htmlFor="bannerAlt">Texto alternativo (alt)</Label>
            <Input
              id="bannerAlt"
              value={bannerAlt}
              onChange={(e) => setBannerAlt(e.target.value)}
              placeholder="Descripción de la imagen"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
