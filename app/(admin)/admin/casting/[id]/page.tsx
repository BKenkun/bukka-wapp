import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { IconArrowLeft, IconMail, IconPhone, IconBrandInstagram, IconBrandTwitter, IconExternalLink } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CastingStatusForm } from "./casting-status-form"

interface Props {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  REVIEWING: "bg-blue-500/20 text-blue-400",
  ACCEPTED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
}

export default async function CastingDetailPage({ params }: Props) {
  const { id } = await params

  const submission = await prisma.castingSubmission.findUnique({
    where: { id },
  })

  if (!submission) {
    notFound()
  }

  const age = submission.birthDate
    ? Math.floor((Date.now() - new Date(submission.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/casting">
            <IconArrowLeft className="mr-2 size-4" />
            Volver a Casting
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold">{submission.name}</h2>
              <Badge className={statusColors[submission.status]}>
                {submission.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Recibido el {new Date(submission.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <IconMail className="size-4 text-muted-foreground" />
                  <a href={`mailto:${submission.email}`} className="hover:underline">
                    {submission.email}
                  </a>
                </div>
                {submission.phone && (
                  <div className="flex items-center gap-2">
                    <IconPhone className="size-4 text-muted-foreground" />
                    <a href={`tel:${submission.phone}`} className="hover:underline">
                      {submission.phone}
                    </a>
                  </div>
                )}
              </div>

              {(submission.instagram || submission.twitter) && (
                <>
                  <Separator />
                  <div className="flex gap-4">
                    {submission.instagram && (
                      <a
                        href={`https://instagram.com/${submission.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <IconBrandInstagram className="size-4" />
                        @{submission.instagram}
                        <IconExternalLink className="size-3" />
                      </a>
                    )}
                    {submission.twitter && (
                      <a
                        href={`https://twitter.com/${submission.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <IconBrandTwitter className="size-4" />
                        @{submission.twitter}
                        <IconExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </>
              )}

              {(submission.city || submission.country) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="font-medium">
                      {[submission.city, submission.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Physical Attributes */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Físicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {age && (
                  <div>
                    <p className="text-sm text-muted-foreground">Edad</p>
                    <p className="font-medium">{age} años</p>
                  </div>
                )}
                {submission.gender && (
                  <div>
                    <p className="text-sm text-muted-foreground">Género</p>
                    <p className="font-medium">{submission.gender}</p>
                  </div>
                )}
                {submission.height && (
                  <div>
                    <p className="text-sm text-muted-foreground">Altura</p>
                    <p className="font-medium">{submission.height} cm</p>
                  </div>
                )}
                {submission.weight && (
                  <div>
                    <p className="text-sm text-muted-foreground">Peso</p>
                    <p className="font-medium">{submission.weight}</p>
                  </div>
                )}
                {submission.bust && (
                  <div>
                    <p className="text-sm text-muted-foreground">Pecho</p>
                    <p className="font-medium">{submission.bust}</p>
                  </div>
                )}
                {submission.waist && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cintura</p>
                    <p className="font-medium">{submission.waist}</p>
                  </div>
                )}
                {submission.hips && (
                  <div>
                    <p className="text-sm text-muted-foreground">Caderas</p>
                    <p className="font-medium">{submission.hips}</p>
                  </div>
                )}
                {submission.hairColor && (
                  <div>
                    <p className="text-sm text-muted-foreground">Color de pelo</p>
                    <p className="font-medium">{submission.hairColor}</p>
                  </div>
                )}
                {submission.eyeColor && (
                  <div>
                    <p className="text-sm text-muted-foreground">Color de ojos</p>
                    <p className="font-medium">{submission.eyeColor}</p>
                  </div>
                )}
                {submission.skinTone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tono de piel</p>
                    <p className="font-medium">{submission.skinTone}</p>
                  </div>
                )}
                {submission.tattoos && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Tatuajes</p>
                    <p className="font-medium">{submission.tattoos}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          {(submission.experience || submission.additionalInfo) && (
            <Card>
              <CardHeader>
                <CardTitle>Experiencia e Información Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.experience && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Experiencia</p>
                    <p className="whitespace-pre-wrap">{submission.experience}</p>
                  </div>
                )}
                {submission.additionalInfo && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Información adicional</p>
                    <p className="whitespace-pre-wrap">{submission.additionalInfo}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {(submission.generalPhotos.length > 0 || submission.dniPhotoUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Fotos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {submission.dniPhotoUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">DNI</p>
                      <a
                        href={submission.dniPhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-[4/3] bg-muted rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={submission.dniPhotoUrl}
                          alt="DNI"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    </div>
                  )}
                  {submission.generalPhotos.map((photo, index) => (
                    <a
                      key={index}
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-[3/4] bg-muted rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video */}
          {submission.videoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Video</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={submission.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <IconExternalLink className="size-4" />
                  Ver video
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Gestión</CardTitle>
              <CardDescription>Actualiza el estado de la solicitud</CardDescription>
            </CardHeader>
            <CardContent>
              <CastingStatusForm submission={submission} />
            </CardContent>
          </Card>

          {/* Notes */}
          {submission.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{submission.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
