import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { FooterAccordion } from "@/components/footer/footer-accordion"
import { NewsletterForm } from "@/components/footer/newsletter-form"
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
    title: "SERVICES",
    links: [
      { label: "The Bukkake Degree™", url: "#" },
      { label: "Shop", url: "/shop" },
      { label: "Blog", url: "/news" },
      { label: "Forum", url: "/forum" },
    ],
  },
  {
    title: "CONTACT",
    links: [
      { label: "Contact & Support", url: "#" },
      { label: "Report Content", url: "#" },
      { label: "Login", url: "/login" },
    ],
  },
  {
    title: "INFORMATION",
    links: [
      { label: "Terms of Service", url: "#" },
      { label: "Privacy Policy", url: "#" },
      { label: "Trust and Safety", url: "#" },
      { label: "Content Removal Policy", url: "#" },
      { label: "Casting", url: "/casting" },
      { label: "Webmaster", url: "#" },
      { label: "Shop/Apparel", url: "/shop" },
    ],
  },
  {
    title: "BILLING",
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

    // Filtrar items por nivel de suscripción del usuario (deslogueado = Visitante, level 0)
    const filteredItems = menu.items.filter((item) => {
      if (item.minTierLevel === null) return true
      return (userTierLevel ?? 0) >= item.minTierLevel
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
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      )
    case "x":
    case "twitter":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case "tiktok":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      )
    case "facebook":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      )
    case "youtube":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75,15.02 15.5,11.75 9.75,8.48" fill="black" />
        </svg>
      )
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
  }
}

function CustomSocialIcon({ svg, label }: { svg: string; label: string }) {
  return (
    <span
      className="size-5 [&>svg]:size-5 [&>svg]:fill-current"
      dangerouslySetInnerHTML={{ __html: svg }}
      title={label}
    />
  )
}

export async function Footer() {
  const currentYear = new Date().getFullYear()

  const session = await auth()
  const userTierLevel = session?.user?.SubscriptionPlan?.level ?? null

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
    getFooterPages(3),
    getFooterSettings(),
  ])

  const sections: FooterSection[] = [
    {
      title: serviciosMenu?.title || "SERVICES",
      links: serviciosMenu?.links || DEFAULT_SECTIONS[0].links,
    },
    {
      title: contactoMenu?.title || "CONTACT",
      links: contactoMenu?.links || DEFAULT_SECTIONS[1].links,
    },
    {
      title: informacionMenu?.title || "INFORMATION",
      links: [
        ...(informacionMenu?.links || DEFAULT_SECTIONS[2].links),
        ...informacionPages,
      ],
    },
    {
      title: facturacionMenu?.title || "BILLING",
      links: facturacionMenu?.links || DEFAULT_SECTIONS[3].links,
    },
  ]

  const socialLinksToUse =
    footerSettings.followUs.socialLinks.length > 0
      ? footerSettings.followUs.socialLinks
      : null

  const copyrightText = footerSettings.copyright.text.replace("{year}", currentYear.toString())

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

  return (
    <footer className="px-4 md:px-8 py-10" style={{ backgroundColor: "var(--footer-bg)", color: "var(--footer-link-color)" }}>
      <div className="max-w-[1400px] mx-auto">

        {/* Mobile: Accordion */}
        <div className="lg:hidden space-y-6">
          <FooterAccordion sections={sections} />

          {/* Follow us row - mobile */}
          <div className="flex items-center gap-4 py-4">
            <span
              className="font-black uppercase tracking-wide shrink-0"
              style={{
                color: "var(--footer-title-color)",
                fontFamily: "var(--global-font)",
                fontSize: "13px",
              }}
            >
              {footerSettings.followUs.title}:
            </span>
            <div className="flex items-center gap-3" style={{ color: "var(--footer-title-color)" }}>
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
                    <a key={social.platform} href={social.url} aria-label={social.platform} className="hover:opacity-80 transition-opacity">
                      <SocialIcon icon={social.icon} />
                    </a>
                  ))}
            </div>
          </div>
        </div>

        {/* Desktop: Horizontal rows like blacked.com */}
        <div className="hidden lg:block space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="flex items-baseline gap-4 flex-wrap">
              <span
                className="font-black uppercase tracking-wide shrink-0"
                style={{
                  color: "var(--footer-title-color)",
                  fontFamily: "var(--global-font)",
                  fontSize: "13px",
                }}
              >
                {section.title}:
              </span>
              <div className="flex items-baseline gap-5 flex-wrap">
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.url}
                    target={link.openInNewTab ? "_blank" : undefined}
                    rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                    className="font-bold uppercase text-xs tracking-wider hover:opacity-100 transition-opacity opacity-60"
                    style={{
                      color: "var(--footer-link-color)",
                      fontFamily: "var(--global-font)",
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Follow us row */}
          <div className="flex items-center gap-4">
            <span
              className="font-black uppercase tracking-wide shrink-0"
              style={{
                color: "var(--footer-title-color)",
                fontFamily: "var(--global-font)",
                fontSize: "13px",
              }}
            >
              {footerSettings.followUs.title}:
            </span>
            <div className="flex items-center gap-3" style={{ color: "var(--footer-title-color)" }}>
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
                    <a key={social.platform} href={social.url} aria-label={social.platform} className="hover:opacity-80 transition-opacity">
                      <SocialIcon icon={social.icon} />
                    </a>
                  ))}
            </div>
          </div>
        </div>

        {/* Newsletter: HTML personalizado del admin o formulario por defecto */}
        <div className="mt-10">
          {footerSettings.newsletter.customHtml ? (
            <div dangerouslySetInnerHTML={{ __html: footerSettings.newsletter.customHtml }} />
          ) : (
            <NewsletterForm
              title={footerSettings.newsletter.title}
              titleUrl={footerSettings.newsletter.titleUrl}
              openInNewTab={footerSettings.newsletter.openInNewTab}
              placeholder={footerSettings.newsletter.placeholder}
              buttonText={footerSettings.newsletter.buttonText}
              privacyText={footerSettings.newsletter.privacyText}
              privacyLinkText={footerSettings.newsletter.privacyLinkText}
              privacyLinkUrl={privacyLinkUrl}
              privacyLinkOpenInNewTab={footerSettings.newsletter.privacyLinkOpenInNewTab}
              source="footer"
            />
          )}
        </div>

        {/* Bottom: Copyright + Disclaimer */}
        <div className="mt-10 pt-6" style={{ borderTop: `1px solid var(--footer-border-color)` }}>
          <p
            className="mb-3"
            style={{
              color: "var(--footer-copyright-color)",
              fontFamily: "var(--global-font)",
              fontSize: "11px",
              fontWeight: 700,
              lineHeight: "18px",
            }}
          >
            {copyrightText}
          </p>
          <div
            className="[&_a]:underline [&_a]:hover:opacity-80 [&_a]:!text-[var(--footer-link-color)]"
            style={{
              color: "var(--footer-copyright-color)",
              fontFamily: "var(--global-font)",
              fontSize: "11px",
              fontWeight: 700,
              lineHeight: "18px",
            }}
            dangerouslySetInnerHTML={{ __html: footerSettings.disclaimer.text }}
          />
        </div>
      </div>
    </footer>
  )
}
