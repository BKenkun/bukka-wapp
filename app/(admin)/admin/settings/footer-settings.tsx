"use client"

import * as React from "react"
import {
  IconLoader2,
  IconX,
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { LocalUploadButton } from "@/components/local-upload-button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface SocialLink {
  id: string
  svg: string
  url: string
  label: string
}

interface Page {
  id: string
  title: string
  slug: string
  status?: string
}

interface FooterSettingsData {
  logo: {
    type: "image" | "text"
    imageUrl: string | null
    text: string
  }
  newsletter: {
    title: string
    titleUrl: string | null
    openInNewTab: boolean
    placeholder: string
    buttonText: string
    customHtml: string
    privacyText: string
    privacyLinkText: string
    privacyLinkUrl: string | null
    privacyLinkPageId: string | null
    privacyLinkOpenInNewTab: boolean
  }
  followUs: {
    title: string
    socialLinks: SocialLink[]
  }
  copyright: {
    text: string
  }
  disclaimer: {
    text: string
  }
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export function FooterSettings() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  // Logo
  const [logoType, setLogoType] = React.useState<"image" | "text">("text")
  const [logoImageUrl, setLogoImageUrl] = React.useState<string | null>(null)
  const [logoText, setLogoText] = React.useState("BUKKAKERY")

  // Newsletter/Castings
  const [newsletterTitle, setNewsletterTitle] = React.useState("CASTINGS")
  const [newsletterTitleUrl, setNewsletterTitleUrl] = React.useState<string | null>(null)
  const [newsletterOpenInNewTab, setNewsletterOpenInNewTab] = React.useState(false)
  const [newsletterPlaceholder, setNewsletterPlaceholder] = React.useState("Introduce tu mail")
  const [newsletterButtonText, setNewsletterButtonText] = React.useState("Enviar")
  const [newsletterCustomHtml, setNewsletterCustomHtml] = React.useState("")
  const [privacyText, setPrivacyText] = React.useState("He leído y acepto la")
  const [privacyLinkText, setPrivacyLinkText] = React.useState("política de privacidad")
  const [privacyLinkUrl, setPrivacyLinkUrl] = React.useState<string | null>(null)
  const [privacyLinkPageId, setPrivacyLinkPageId] = React.useState<string | null>(null)
  const [privacyLinkOpenInNewTab, setPrivacyLinkOpenInNewTab] = React.useState(false)
  const [privacyLinkType, setPrivacyLinkType] = React.useState<"url" | "page">("url")
  const [pages, setPages] = React.useState<Page[]>([])

  // Follow Us
  const [followUsTitle, setFollowUsTitle] = React.useState("SÍGUENOS")
  const [socialLinks, setSocialLinks] = React.useState<SocialLink[]>([])

  // Copyright
  const [copyrightText, setCopyrightText] = React.useState("© {year} . All Rights Reserved.")

  // Disclaimer
  const [disclaimerText, setDisclaimerText] = React.useState(
    "All performers appearing on this website are 18 years or older. All video, images, design, graphics are copyright. For inquiries or to cancel your membership, please visit [Tu URL de Contacto/Soporte] or contact our authorized sales agents. 18 U.S.C. §§ 2257–2257A Record-Keeping Compliance Statement (Link a /declaracion-2257)"
  )

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // Load settings and pages in parallel
      const [settingsResponse, pagesResponse] = await Promise.all([
        fetch("/api/admin/settings/footer"),
        fetch("/api/admin/pages"),
      ])

      if (settingsResponse.ok) {
        const data: FooterSettingsData = await settingsResponse.json()

        // Logo
        setLogoType(data.logo?.type || "text")
        setLogoImageUrl(data.logo?.imageUrl || null)
        setLogoText(data.logo?.text || "BUKKAKERY")

        // Newsletter
        setNewsletterTitle(data.newsletter?.title || "CASTINGS")
        setNewsletterTitleUrl(data.newsletter?.titleUrl || null)
        setNewsletterOpenInNewTab(data.newsletter?.openInNewTab || false)
        setNewsletterPlaceholder(data.newsletter?.placeholder || "Introduce tu mail")
        setNewsletterButtonText(data.newsletter?.buttonText || "Enviar")
        setNewsletterCustomHtml(data.newsletter?.customHtml || "")
        setPrivacyText(data.newsletter?.privacyText || "He leído y acepto la")
        setPrivacyLinkText(data.newsletter?.privacyLinkText || "política de privacidad")
        setPrivacyLinkUrl(data.newsletter?.privacyLinkUrl || null)
        setPrivacyLinkPageId(data.newsletter?.privacyLinkPageId || null)
        setPrivacyLinkOpenInNewTab(data.newsletter?.privacyLinkOpenInNewTab || false)
        setPrivacyLinkType(data.newsletter?.privacyLinkPageId ? "page" : "url")

        // Follow Us
        setFollowUsTitle(data.followUs?.title || "SÍGUENOS")
        setSocialLinks(data.followUs?.socialLinks || [])

        // Copyright
        setCopyrightText(data.copyright?.text || "© {year} . All Rights Reserved.")

        // Disclaimer
        setDisclaimerText(
          data.disclaimer?.text ||
            "All performers appearing on this website are 18 years or older..."
        )
      }

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json()
        console.log("Pages API response:", pagesData)
        // API returns array directly, filter published pages
        const publishedPages = Array.isArray(pagesData)
          ? pagesData.filter((p: Page) => p.status === "PUBLISHED")
          : []
        console.log("Published pages:", publishedPages)
        setPages(publishedPages)
      } else {
        console.error("Pages API error:", pagesResponse.status, await pagesResponse.text())
      }
    } catch (error) {
      console.error("Error loading footer settings:", error)
      toast.error("Error al cargar la configuración del footer")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const data: FooterSettingsData = {
        logo: {
          type: logoType,
          imageUrl: logoImageUrl,
          text: logoText,
        },
        newsletter: {
          title: newsletterTitle,
          titleUrl: newsletterTitleUrl,
          openInNewTab: newsletterOpenInNewTab,
          placeholder: newsletterPlaceholder,
          buttonText: newsletterButtonText,
          customHtml: newsletterCustomHtml,
          privacyText: privacyText,
          privacyLinkText: privacyLinkText,
          privacyLinkUrl: privacyLinkUrl,
          privacyLinkPageId: privacyLinkPageId,
          privacyLinkOpenInNewTab: privacyLinkOpenInNewTab,
        },
        followUs: {
          title: followUsTitle,
          socialLinks: socialLinks,
        },
        copyright: {
          text: copyrightText,
        },
        disclaimer: {
          text: disclaimerText,
        },
      }

      const response = await fetch("/api/admin/settings/footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Error al guardar")
      }

      toast.success("Configuración del footer guardada correctamente")
    } catch (error) {
      toast.error("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  // Social Links handlers
  const addSocialLink = () => {
    setSocialLinks([
      ...socialLinks,
      {
        id: generateId(),
        svg: "",
        url: "",
        label: "",
      },
    ])
  }

  const removeSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter((link) => link.id !== id))
  }

  const updateSocialLink = (id: string, field: keyof SocialLink, value: string) => {
    setSocialLinks(
      socialLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link))
    )
  }

  const moveSocialLink = (index: number, direction: "up" | "down") => {
    const newLinks = [...socialLinks]
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= socialLinks.length) return
    const temp = newLinks[index]
    newLinks[index] = newLinks[newIndex]
    newLinks[newIndex] = temp
    setSocialLinks(newLinks)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Logo del Footer</CardTitle>
          <CardDescription>
            Configura el logo que aparece en la esquina superior izquierda del footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={logoType}
            onValueChange={(value) => setLogoType(value as "image" | "text")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="logo-text" />
              <Label htmlFor="logo-text">Texto</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="logo-image" />
              <Label htmlFor="logo-image">Imagen</Label>
            </div>
          </RadioGroup>

          {logoType === "text" ? (
            <div className="space-y-2">
              <Label htmlFor="logoText">Texto del Logo</Label>
              <Input
                id="logoText"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                placeholder="BUKKAKERY"
              />
              <p className="text-xs text-muted-foreground">
                Se mostrará con el estilo de marca (rosa, negrita)
              </p>

              {/* Preview */}
              <div className="mt-4 p-4 bg-black rounded-lg">
                <span
                  className="text-[#FA4860] font-black"
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: "33px",
                    fontWeight: 900,
                  }}
                >
                  {logoText || "LOGO"}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Imagen del Logo</Label>
              {logoImageUrl ? (
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="bg-black p-2 rounded">
                    <img
                      src={logoImageUrl}
                      alt="Logo preview"
                      className="h-12 object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Logo actual</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {logoImageUrl}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setLogoImageUrl(null)}>
                    <IconX className="size-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              ) : (
                <LocalUploadButton
                  folder="footer"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  buttonText="Subir Logo"
                  maxSize="1MB"
                  onUploadComplete={(result) => {
                    setLogoImageUrl(result.url)
                    toast.success("Logo subido correctamente")
                  }}
                  onUploadError={(error) => {
                    toast.error(error.message)
                  }}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Newsletter/Castings Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sección Newsletter / Castings</CardTitle>
          <CardDescription>
            Configura el título y formulario de suscripción
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newsletterTitle">Título de la Sección</Label>
              <Input
                id="newsletterTitle"
                value={newsletterTitle}
                onChange={(e) => setNewsletterTitle(e.target.value)}
                placeholder="CASTINGS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newsletterTitleUrl">URL del Título (opcional)</Label>
              <Input
                id="newsletterTitleUrl"
                value={newsletterTitleUrl || ""}
                onChange={(e) => setNewsletterTitleUrl(e.target.value || null)}
                placeholder="https://... o /ruta-interna"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="newsletterOpenInNewTab">Abrir en nueva pestaña</Label>
              <p className="text-xs text-muted-foreground">
                El enlace del título se abrirá en una nueva ventana
              </p>
            </div>
            <Switch
              id="newsletterOpenInNewTab"
              checked={newsletterOpenInNewTab}
              onCheckedChange={setNewsletterOpenInNewTab}
              disabled={!newsletterTitleUrl}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newsletterPlaceholder">Placeholder del Campo Email</Label>
              <Input
                id="newsletterPlaceholder"
                value={newsletterPlaceholder}
                onChange={(e) => setNewsletterPlaceholder(e.target.value)}
                placeholder="Introduce tu mail"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newsletterButtonText">Texto del Botón</Label>
              <Input
                id="newsletterButtonText"
                value={newsletterButtonText}
                onChange={(e) => setNewsletterButtonText(e.target.value)}
                placeholder="Enviar"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="newsletterCustomHtml">Formulario Personalizado (HTML)</Label>
            <Textarea
              id="newsletterCustomHtml"
              value={newsletterCustomHtml}
              onChange={(e) => setNewsletterCustomHtml(e.target.value)}
              placeholder="Pega aquí el código HTML de tu formulario de Mailchimp, Sendinblue, etc."
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Pega el código HTML de tu proveedor de email marketing (Mailchimp, Sendinblue, ConvertKit, etc.).
              Si dejas este campo vacío, se mostrará un formulario básico por defecto.
            </p>
          </div>

          <Separator />

          {/* Privacy Policy Link */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Política de Privacidad</Label>
            <p className="text-xs text-muted-foreground">
              Configura el texto y enlace de política de privacidad que aparece debajo del formulario de suscripción.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="privacyText">Texto previo al enlace</Label>
                <Input
                  id="privacyText"
                  value={privacyText}
                  onChange={(e) => setPrivacyText(e.target.value)}
                  placeholder="He leído y acepto la"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privacyLinkText">Texto del enlace</Label>
                <Input
                  id="privacyLinkText"
                  value={privacyLinkText}
                  onChange={(e) => setPrivacyLinkText(e.target.value)}
                  placeholder="política de privacidad"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de enlace</Label>
              <p className="text-xs text-muted-foreground">
                (Debug: {pages.length} páginas cargadas)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={privacyLinkType === "url" ? "secondary" : "outline"}
                  className="justify-start"
                  onClick={() => {
                    setPrivacyLinkType("url")
                    setPrivacyLinkPageId(null)
                  }}
                >
                  URL personalizada
                </Button>
                <Button
                  type="button"
                  variant={privacyLinkType === "page" ? "secondary" : "outline"}
                  className="justify-start"
                  onClick={() => {
                    setPrivacyLinkType("page")
                    setPrivacyLinkUrl(null)
                  }}
                >
                  Página interna
                </Button>
              </div>
            </div>

            {privacyLinkType === "url" ? (
              <div className="space-y-2">
                <Label htmlFor="privacyLinkUrl">URL del enlace</Label>
                <Input
                  id="privacyLinkUrl"
                  value={privacyLinkUrl || ""}
                  onChange={(e) => setPrivacyLinkUrl(e.target.value || null)}
                  placeholder="https://... o /politica-privacidad"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Página</Label>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando páginas...</p>
                ) : pages.length > 0 ? (
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={privacyLinkPageId || ""}
                    onChange={(e) => setPrivacyLinkPageId(e.target.value || null)}
                  >
                    <option value="">Selecciona una página</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay páginas publicadas disponibles (verifica que tengas páginas con estado PUBLISHED)
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="privacyLinkOpenInNewTab">Abrir en nueva pestaña</Label>
                <p className="text-xs text-muted-foreground">
                  El enlace de privacidad se abrirá en una nueva ventana
                </p>
              </div>
              <Switch
                id="privacyLinkOpenInNewTab"
                checked={privacyLinkOpenInNewTab}
                onCheckedChange={setPrivacyLinkOpenInNewTab}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 bg-black rounded-lg space-y-4">
            <h3
              className="text-white font-bold"
              style={{
                fontFamily: "Montserrat",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              {newsletterTitleUrl ? (
                <span className="underline cursor-pointer">{newsletterTitle || "TÍTULO"}</span>
              ) : (
                newsletterTitle || "TÍTULO"
              )}
            </h3>
            {newsletterCustomHtml ? (
              <div
                className="newsletter-custom-html"
                dangerouslySetInnerHTML={{ __html: newsletterCustomHtml }}
              />
            ) : (
              <div className="flex w-full max-w-md">
                <input
                  type="text"
                  placeholder={newsletterPlaceholder || "Introduce tu mail"}
                  className="flex-1 px-4 py-2 text-white placeholder-white/70 text-sm"
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                  }}
                  disabled
                />
                <button
                  className="px-4 py-2 text-white font-bold text-sm"
                  style={{
                    background: "#FA4860",
                  }}
                  disabled
                >
                  {newsletterButtonText || "Enviar"}
                </button>
              </div>
            )}
            {/* Privacy text preview */}
            {(privacyText || privacyLinkText) && (
              <div className="flex items-center gap-1 mt-3">
                <input type="checkbox" className="accent-[#FA4860]" disabled />
                <p className="text-white/70 text-xs">
                  {privacyText}{" "}
                  <span className="text-[#FA4860] hover:underline cursor-pointer">
                    {privacyLinkText}
                  </span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Follow Us Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sección Síguenos</CardTitle>
          <CardDescription>
            Configura el título y los enlaces a redes sociales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="followUsTitle">Título de la Sección</Label>
            <Input
              id="followUsTitle"
              value={followUsTitle}
              onChange={(e) => setFollowUsTitle(e.target.value)}
              placeholder="SÍGUENOS"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Redes Sociales</Label>
              <Button onClick={addSocialLink} size="sm" variant="outline">
                <IconPlus className="size-4 mr-1" />
                Añadir Red Social
              </Button>
            </div>

            {socialLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay redes sociales configuradas. Añade una para comenzar.
              </p>
            ) : (
              <div className="space-y-3">
                {socialLinks.map((link, index) => (
                  <div
                    key={link.id}
                    className="border rounded-lg p-4 bg-card space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() => moveSocialLink(index, "up")}
                            disabled={index === 0}
                          >
                            <IconChevronUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() => moveSocialLink(index, "down")}
                            disabled={index === socialLinks.length - 1}
                          >
                            <IconChevronDown className="size-4" />
                          </Button>
                        </div>
                        <span className="font-medium text-sm">
                          {link.label || `Red Social ${index + 1}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => removeSocialLink(link.id)}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Nombre / Etiqueta</Label>
                        <Input
                          value={link.label}
                          onChange={(e) => updateSocialLink(link.id, "label", e.target.value)}
                          placeholder="Instagram, Twitter, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={link.url}
                          onChange={(e) => updateSocialLink(link.id, "url", e.target.value)}
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Código SVG del Icono</Label>
                      <Textarea
                        value={link.svg}
                        onChange={(e) => updateSocialLink(link.id, "svg", e.target.value)}
                        placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>'
                        rows={3}
                        className="font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Pega el código SVG completo. El icono se ajustará a 24x24px.
                      </p>
                    </div>

                    {/* Preview del icono */}
                    {link.svg && (
                      <div className="flex items-center gap-2 p-2 bg-black rounded">
                        <span
                          className="size-6 [&>svg]:size-6 [&>svg]:fill-white text-white"
                          dangerouslySetInnerHTML={{ __html: link.svg }}
                        />
                        <span className="text-white text-sm">{link.label}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {socialLinks.length > 0 && (
            <div className="mt-4 p-4 bg-black rounded-lg space-y-4">
              <h3
                className="text-white font-bold"
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                {followUsTitle || "SÍGUENOS"}
              </h3>
              <div className="flex items-center gap-4">
                {socialLinks.map(
                  (link) =>
                    link.svg && (
                      <span
                        key={link.id}
                        className="size-6 [&>svg]:size-6 [&>svg]:fill-white text-white cursor-pointer hover:opacity-80"
                        dangerouslySetInnerHTML={{ __html: link.svg }}
                        title={link.label}
                      />
                    )
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Copyright & Disclaimer */}
      <Card>
        <CardHeader>
          <CardTitle>Copyright y Aviso Legal</CardTitle>
          <CardDescription>
            Configura los textos legales del pie de página
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="copyrightText">Texto de Copyright</Label>
            <Input
              id="copyrightText"
              value={copyrightText}
              onChange={(e) => setCopyrightText(e.target.value)}
              placeholder="© {year} . All Rights Reserved."
            />
            <p className="text-xs text-muted-foreground">
              Usa <code className="bg-muted px-1 rounded">{"{year}"}</code> para insertar el año
              actual automáticamente
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Texto del Disclaimer / Aviso Legal</Label>
            <RichTextEditor
              content={disclaimerText}
              onChange={setDisclaimerText}
              placeholder="All performers appearing on this website..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Este texto aparece al final del footer. Puedes incluir información legal, enlaces a
              políticas, etc. Usa el editor para añadir enlaces y formato.
            </p>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 bg-black rounded-lg space-y-2 text-center">
            <p
              className="text-white"
              style={{
                fontFamily: "Montserrat",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              {copyrightText.replace("{year}", new Date().getFullYear().toString()) ||
                "© 2026 . All Rights Reserved."}
            </p>
            <div
              className="text-white/80 prose prose-sm prose-invert max-w-none [&_a]:text-[#FA4860] [&_a]:underline"
              style={{
                fontFamily: "Montserrat",
                fontSize: "11px",
                fontWeight: 700,
                lineHeight: "20px",
              }}
              dangerouslySetInnerHTML={{ __html: disclaimerText || "<p>Texto del disclaimer...</p>" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          Guardar Configuración del Footer
        </Button>
      </div>
    </div>
  )
}
