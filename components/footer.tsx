import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { FooterAccordion } from "@/components/footer/footer-accordion"
import { getFooterSettings, type FooterSocialLink } from "@/lib/get-footer-settings"
import { auth } from "@/auth"

interface FooterLink {
  label: string
  url: string
  openInNewTab?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

// Links por defecto si los menús no están configurados
const DEFAULT_SECTIONS: FooterSection[] = [
  {
    title: "SERVICIOS",
    links: [
      { label: "The Bukkake Degree™", url: "#" },
      { label: "Tienda", url: "/tienda" },
      { label: "Blog", url: "/blog" },
      { label: "Foro", url: "/foro" },
    ],
  },
  {
    title: "CONTACTO",
    links: [
      { label: "Contact & Support", url: "#" },
      { label: "Report Content", url: "#" },
      { label: "Login", url: "/login" },
    ],
  },
  {
    title: "INFORMACIÓN",
    links: [
      { label: "Terms of Service", url: "#" },
      { label: "Privacy Policy", url: "#" },
      { label: "Trust and Safety", url: "#" },
      { label: "Content Removal Policy", url: "#" },
      { label: "Casting", url: "/casting" },
      { label: "Webmaster", url: "#" },
      { label: "Tienda/Apparel", url: "/tienda" },
    ],
  },
  {
    title: "FACTURACIÓN",
    links: [
      { label: "Epoch", url: "#" },
      { label: "Segpay", url: "#" },
      { label: "Vxnbill", url: "#" },
      { label: "Centrobill", url: "#" },
      { label: "Echst", url: "#" },
      { label: "Supportsk", url: "#" },
      { label: "Spizoo", url: "#" },
    ],
  },
]

interface SocialLink {
  platform: string
  url: string
  icon: string
}

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: "Instagram", url: "#", icon: "instagram" },
  { platform: "X", url: "#", icon: "x" },
  { platform: "TikTok", url: "#", icon: "tiktok" },
]

interface FooterMenuResult {
  title: string | null
  links: FooterLink[]
}

async function getFooterMenuItems(slug: string, userTierLevel: number | null): Promise<FooterMenuResult | null> {
  try {
    const menu = await prisma.menu.findUnique({
      where: { slug },
      include: {
        items: {
          where: { isVisible: true, parentId: null },
          orderBy: { order: "asc" },
          select: {
            id: true,
            label: true,
            url: true,
            pageId: true,
            openInNewTab: true,
            minTierLevel: true,
          },
        },
      },
    })

    if (!menu || menu.items.length === 0) {
      return null
    }

    // Filtrar items por nivel de suscripción del usuario
    const filteredItems = menu.items.filter((item) => {
      // Si el item no tiene restricción de tier, es visible para todos
      if (item.minTierLevel === null) return true
      // Si el usuario no tiene suscripción, solo ve items sin restricción
      if (userTierLevel === null) return false
      // El usuario ve el item si su nivel es >= al mínimo requerido
      return userTierLevel >= item.minTierLevel
    })

    if (filteredItems.length === 0) {
      return null
    }

    // Resolver URLs de páginas internas
    const itemsWithUrls = await Promise.all(
      filteredItems.map(async (item) => {
        if (item.pageId) {
          const page = await prisma.page.findUnique({
            where: { id: item.pageId, status: "PUBLISHED" },
            select: { slug: true },
          })
          return {
            label: item.label,
            url: page ? `/p/${page.slug}` : item.url || "#",
            openInNewTab: item.openInNewTab,
          }
        }
        return {
          label: item.label,
          url: item.url || "#",
          openInNewTab: item.openInNewTab,
        }
      })
    )

    return {
      title: menu.title,
      links: itemsWithUrls,
    }
  } catch (error) {
    console.error(`Error fetching footer menu ${slug}:`, error)
    return null
  }
}

async function getFooterPages(column: number): Promise<FooterLink[]> {
  try {
    const pages = await prisma.page.findMany({
      where: {
        showInFooter: true,
        footerColumn: column,
        status: "PUBLISHED",
      },
      orderBy: { footerOrder: "asc" },
      select: {
        title: true,
        slug: true,
      },
    })

    return pages.map((page) => ({
      label: page.title,
      url: `/p/${page.slug}`,
    }))
  } catch (error) {
    console.error(`Error fetching footer pages for column ${column}:`, error)
    return []
  }
}

async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const menu = await prisma.menu.findUnique({
      where: { slug: "footer-social" },
      include: {
        items: {
          where: { isVisible: true },
          orderBy: { order: "asc" },
          select: {
            label: true,
            url: true,
            icon: true,
          },
        },
      },
    })

    if (!menu || menu.items.length === 0) {
      return DEFAULT_SOCIAL_LINKS
    }

    return menu.items.map((item) => ({
      platform: item.label,
      url: item.url || "#",
      icon: item.icon || item.label.toLowerCase(),
    }))
  } catch (error) {
    console.error("Error fetching social links:", error)
    return DEFAULT_SOCIAL_LINKS
  }
}

function SocialIcon({ icon }: { icon: string }) {
  switch (icon.toLowerCase()) {
    case "instagram":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      )
    case "x":
    case "twitter":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case "tiktok":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      )
    case "facebook":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      )
    case "youtube":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75,15.02 15.5,11.75 9.75,8.48" fill="black" />
        </svg>
      )
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
  }
}

// Componente para renderizar iconos SVG personalizados de redes sociales
function CustomSocialIcon({ svg, label }: { svg: string; label: string }) {
  return (
    <span
      className="size-6 [&>svg]:size-6 [&>svg]:fill-white text-white"
      dangerouslySetInnerHTML={{ __html: svg }}
      title={label}
    />
  )
}

// Componente para el logo del footer
function FooterLogo({
  type,
  imageUrl,
  text,
}: {
  type: "image" | "text"
  imageUrl: string | null
  text: string
}) {
  if (type === "image" && imageUrl) {
    return <img src={imageUrl} alt={text || "Logo"} className="h-[40px] object-contain" />
  }

  return (
    <span
      className="text-[#FA4860] font-black"
      style={{
        fontFamily: "Montserrat",
        fontSize: "33.029px",
        fontWeight: 900,
        lineHeight: "normal",
      }}
    >
      {text || "LOGO"}
    </span>
  )
}

function FooterLinkItem({ link }: { link: FooterLink }) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-white text-xs shrink-0">•</span>
      <Link
        href={link.url}
        target={link.openInNewTab ? "_blank" : undefined}
        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
        className="text-white hover:text-gray-300 transition-colors"
        style={{
          fontFamily: "Montserrat",
          fontSize: "14px",
          fontWeight: 700,
          lineHeight: "37px",
        }}
      >
        {link.label}
      </Link>
    </li>
  )
}

function FooterColumn({ title, links }: FooterSection) {
  return (
    <div className="lg:col-span-2">
      <h3
        className="text-white font-bold mb-4"
        style={{
          fontFamily: "Montserrat",
          fontSize: "18px",
          fontWeight: 700,
          lineHeight: "71px",
        }}
      >
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <FooterLinkItem key={link.label} link={link} />
        ))}
      </ul>
    </div>
  )
}

export async function Footer() {
  const currentYear = new Date().getFullYear()

  // Obtener sesión del usuario para filtrar menús por suscripción
  const session = await auth()
  const userTierLevel = session?.user?.SubscriptionPlan?.level ?? null

  // Fetch all footer data in parallel
  const [
    serviciosMenu,
    contactoMenu,
    informacionMenu,
    facturacionMenu,
    menuSocialLinks,
    informacionPages,
    footerSettings,
  ] = await Promise.all([
    getFooterMenuItems("footer-col-1", userTierLevel),
    getFooterMenuItems("footer-col-2", userTierLevel),
    getFooterMenuItems("footer-col-3", userTierLevel),
    getFooterMenuItems("footer-col-4", userTierLevel),
    getSocialLinks(),
    getFooterPages(3), // Column 3 = INFORMACIÓN
    getFooterSettings(),
  ])

  // Build sections with DB data or defaults
  const sections: FooterSection[] = [
    {
      title: serviciosMenu?.title || "SERVICIOS",
      links: serviciosMenu?.links || DEFAULT_SECTIONS[0].links,
    },
    {
      title: contactoMenu?.title || "CONTACTO",
      links: contactoMenu?.links || DEFAULT_SECTIONS[1].links,
    },
    {
      title: informacionMenu?.title || "INFORMACIÓN",
      links: [
        ...(informacionMenu?.links || DEFAULT_SECTIONS[2].links),
        ...informacionPages, // Añadir páginas CMS configuradas para footer
      ],
    },
    {
      title: facturacionMenu?.title || "FACTURACIÓN",
      links: facturacionMenu?.links || DEFAULT_SECTIONS[3].links,
    },
  ]

  // Usar las redes sociales de la configuración del footer si existen, sino del menú
  const socialLinksToUse =
    footerSettings.followUs.socialLinks.length > 0
      ? footerSettings.followUs.socialLinks
      : null

  // Copyright con el año actual
  const copyrightText = footerSettings.copyright.text.replace("{year}", currentYear.toString())

  // Resolver la URL del enlace de privacidad
  let privacyLinkUrl = footerSettings.newsletter.privacyLinkUrl
  if (footerSettings.newsletter.privacyLinkPageId) {
    const privacyPage = await prisma.page.findFirst({
      where: {
        id: footerSettings.newsletter.privacyLinkPageId,
        status: "PUBLISHED"
      },
      select: { slug: true },
    })
    if (privacyPage) {
      privacyLinkUrl = `/p/${privacyPage.slug}`
    }
  }

  // Componente para renderizar el texto de privacidad
  const renderPrivacyText = () => {
    if (!footerSettings.newsletter.privacyText && !footerSettings.newsletter.privacyLinkText) {
      return null
    }

    return (
      <label className="mt-3 flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="accent-[#FA4860] cursor-pointer" />
        <span
          className="text-white/70"
          style={{
            fontFamily: "Montserrat",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {footerSettings.newsletter.privacyText}{" "}
          {privacyLinkUrl ? (
            <Link
              href={privacyLinkUrl}
              target={footerSettings.newsletter.privacyLinkOpenInNewTab ? "_blank" : undefined}
              rel={footerSettings.newsletter.privacyLinkOpenInNewTab ? "noopener noreferrer" : undefined}
              className="text-[#FA4860] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {footerSettings.newsletter.privacyLinkText}
            </Link>
          ) : (
            <span className="text-[#FA4860]">{footerSettings.newsletter.privacyLinkText}</span>
          )}
        </span>
      </label>
    )
  }

  // Función para renderizar el título del newsletter (con o sin enlace)
  const renderNewsletterTitle = () => {
    const title = (
      <h3
        className="text-white font-bold mb-4"
        style={{
          fontFamily: "Montserrat",
          fontSize: "18px",
          fontWeight: 700,
          lineHeight: "71px",
        }}
      >
        {footerSettings.newsletter.title}
      </h3>
    )

    if (footerSettings.newsletter.titleUrl) {
      return (
        <Link
          href={footerSettings.newsletter.titleUrl}
          target={footerSettings.newsletter.openInNewTab ? "_blank" : undefined}
          rel={footerSettings.newsletter.openInNewTab ? "noopener noreferrer" : undefined}
          className="hover:opacity-80 transition-opacity"
        >
          {title}
        </Link>
      )
    }

    return title
  }

  return (
    <footer className="bg-black text-white px-4 md:px-8 py-12">
      <div className="w-full">
        {/* Mobile & Tablet: 1-2 column layout with accordion */}
        <div className="lg:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Logo and Casting Form Section */}
            <div className="flex flex-col">
              <div className="mb-8">
                <FooterLogo
                  type={footerSettings.logo.type}
                  imageUrl={footerSettings.logo.imageUrl}
                  text={footerSettings.logo.text}
                />
              </div>

              <div className="mb-8">
                {renderNewsletterTitle()}

                {footerSettings.newsletter.customHtml ? (
                  <div
                    className="newsletter-custom-html"
                    dangerouslySetInnerHTML={{ __html: footerSettings.newsletter.customHtml }}
                  />
                ) : (
                  <>
                    <div className="flex w-full">
                      <input
                        type="email"
                        placeholder={footerSettings.newsletter.placeholder}
                        className="flex-1 px-4 text-white placeholder-white min-w-0"
                        style={{
                          background: "rgba(255, 255, 255, 0.15)",
                          fontFamily: "Montserrat",
                          fontSize: "18px",
                          fontWeight: 700,
                          lineHeight: "37px",
                          border: "none",
                          outline: "none",
                          paddingTop: "10px",
                          paddingBottom: "10px",
                        }}
                      />
                      <button
                        className="px-4 text-white font-bold whitespace-nowrap"
                        style={{
                          background: "#FA4860",
                          fontFamily: "Montserrat",
                          fontSize: "18px",
                          fontWeight: 700,
                          lineHeight: "37px",
                          paddingTop: "10px",
                          paddingBottom: "10px",
                        }}
                      >
                        {footerSettings.newsletter.buttonText}
                      </button>
                    </div>
                    {renderPrivacyText()}
                  </>
                )}
              </div>

              <div>
                <h3
                  className="text-white font-bold mb-4"
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: "18px",
                    fontWeight: 700,
                    lineHeight: "71px",
                  }}
                >
                  {footerSettings.followUs.title}
                </h3>

                <div className="flex items-center gap-[15px]">
                  {socialLinksToUse
                    ? socialLinksToUse.map((social) => (
                        <a
                          key={social.id}
                          href={social.url}
                          aria-label={social.label}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-80 transition-opacity"
                        >
                          <CustomSocialIcon svg={social.svg} label={social.label} />
                        </a>
                      ))
                    : menuSocialLinks.map((social) => (
                        <a key={social.platform} href={social.url} aria-label={social.platform}>
                          <SocialIcon icon={social.icon} />
                        </a>
                      ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <FooterAccordion sections={sections} />
            </div>
          </div>
        </div>

        {/* Desktop: Full grid layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-[40px] mb-12">
          <div className="flex flex-col lg:col-span-4">
            <div className="mb-8">
              <FooterLogo
                type={footerSettings.logo.type}
                imageUrl={footerSettings.logo.imageUrl}
                text={footerSettings.logo.text}
              />
            </div>

            <div className="mb-8">
              {renderNewsletterTitle()}

              {footerSettings.newsletter.customHtml ? (
                <div
                  className="newsletter-custom-html"
                  dangerouslySetInnerHTML={{ __html: footerSettings.newsletter.customHtml }}
                />
              ) : (
                <>
                  <div className="flex w-full">
                    <input
                      type="email"
                      placeholder={footerSettings.newsletter.placeholder}
                      className="flex-1 px-4 text-white placeholder-white min-w-0"
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        fontFamily: "Montserrat",
                        fontSize: "18px",
                        fontWeight: 700,
                        lineHeight: "37px",
                        border: "none",
                        outline: "none",
                        paddingTop: "10px",
                        paddingBottom: "10px",
                      }}
                    />
                    <button
                      className="px-6 text-white font-bold whitespace-nowrap"
                      style={{
                        background: "#FA4860",
                        fontFamily: "Montserrat",
                        fontSize: "18px",
                        fontWeight: 700,
                        lineHeight: "37px",
                        paddingTop: "10px",
                        paddingBottom: "10px",
                      }}
                    >
                      {footerSettings.newsletter.buttonText}
                    </button>
                  </div>
                  {renderPrivacyText()}
                </>
              )}
            </div>

            <div>
              <h3
                className="text-white font-bold mb-4"
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "18px",
                  fontWeight: 700,
                  lineHeight: "71px",
                }}
              >
                {footerSettings.followUs.title}
              </h3>

              <div className="flex items-center gap-[15px]">
                {socialLinksToUse
                  ? socialLinksToUse.map((social) => (
                      <a
                        key={social.id}
                        href={social.url}
                        aria-label={social.label}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-80 transition-opacity"
                      >
                        <CustomSocialIcon svg={social.svg} label={social.label} />
                      </a>
                    ))
                  : menuSocialLinks.map((social) => (
                      <a key={social.platform} href={social.url} aria-label={social.platform}>
                        <SocialIcon icon={social.icon} />
                      </a>
                    ))}
              </div>
            </div>
          </div>

          {sections.map((section) => (
            <FooterColumn key={section.title} title={section.title} links={section.links} />
          ))}
        </div>

        <div className="text-center border-t border-white/10 pt-8 mt-12">
          <p
            className="text-white mb-4"
            style={{
              fontFamily: "Montserrat",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "71px",
            }}
          >
            {copyrightText}
          </p>
          <p
            className="text-white max-w-4xl mx-auto px-4"
            style={{
              fontFamily: "Montserrat",
              fontSize: "11px",
              fontWeight: 700,
              lineHeight: "28px",
            }}
          >
            {footerSettings.disclaimer.text}
          </p>
        </div>
      </div>
    </footer>
  )
}
