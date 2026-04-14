"use client"

import * as React from "react"

interface ButtonSettings {
  backgroundColor: string
  textColor: string
  borderRadius: string
  fontSize: string
  fontWeight: string
  padding: string
  hoverBackgroundColor: string
  hoverTextColor: string
  borderColor?: string
  borderWidth?: string
}

interface ThemeSettings {
  global: {
    backgroundColor: string
    fontFamily: string
    brandColor: string
    brandColorHover: string
    accentColor: string
    textPrimary: string
    textSecondary: string
    textMuted: string
    linkColor: string
    surfaceBg: string
    borderColor: string
    successColor: string
    errorColor: string
    warningColor: string
  }
  topBar: {
    backgroundColor: string
    textColor: string
    fontSize: string
    fontWeight: string
    height: string
    iconColor: string
  }
  header: {
    navTextColor: string
    navFontSize: string
    navFontWeight: string
    navHoverColor: string
    logoColor: string
  }
  sectionHeaders: {
    textColor: string
    fontSize: string
    fontWeight: string
    textTransform: string
    letterSpacing: string
    lineColor: string
    lineHeight: string
    backgroundColor: string
  }
  videoCards: {
    titleColor: string
    titleFontSize: string
    titleFontWeight: string
    metaColor: string
    metaFontSize: string
    hoverAccentColor: string
  }
  performerCards: {
    nameColor: string
    nameFontSize: string
    nameFontWeight: string
    statsColor: string
    verifiedColor: string
  }
  ctaBanner: {
    titleColor: string
    titleFontSize: string
    descriptionColor: string
    descriptionFontSize: string
    overlayOpacity: string
  }
  countdown: {
    titleColor: string
    titleFontSize: string
    subtitleColor: string
    numberColor: string
    numberFontSize: string
    labelColor: string
    separatorColor: string
  }
  footer: {
    backgroundColor: string
    titleColor: string
    titleFontSize: string
    titleFontWeight: string
    linkColor: string
    linkHoverColor: string
    linkFontSize: string
    copyrightColor: string
    disclaimerLinkColor: string
    borderColor: string
    newsletterInputBg: string
    newsletterButtonBg: string
    socialIconColor: string
  }
  forms: {
    inputBg: string
    inputBorder: string
    inputText: string
    inputFocusBorder: string
    labelColor: string
    placeholderColor: string
  }
  cart: {
    itemNameColor: string
    itemMetaColor: string
    priceColor: string
    quantityBorderColor: string
    quantityButtonHoverBg: string
    summaryLabelColor: string
    removeButtonColor: string
    removeButtonHoverColor: string
    emptyIconColor: string
    emptyTextColor: string
    trustBadgeColor: string
  }
  comingSoon: {
    labelBg: string
    labelColor: string
    nameBg: string
    nameColor: string
    numberColor: string
    letterColor: string
    buttonBg: string
    buttonColor: string
  }
  carouselArrows: {
    backgroundColor: string
    iconColor: string
    borderColor: string
    borderWidth: string
    size: string
    borderRadius: string
    hoverBackgroundColor: string
  }
  buttons: {
    primary: ButtonSettings
    secondary: ButtonSettings
  }
  variantSelector: {
    selectedBg: string
    selectedText: string
    defaultBg: string
    defaultText: string
  }
}

const defaultTheme: ThemeSettings = {
  global: {
    backgroundColor: "#000000",
    fontFamily: "Montserrat",
    brandColor: "#FA4860",
    brandColorHover: "#E03E54",
    accentColor: "#00B1DE",
    textPrimary: "#FFFFFF",
    textSecondary: "#E0E0E0",
    textMuted: "#999999",
    linkColor: "#FA4860",
    surfaceBg: "#1a1a1a",
    borderColor: "#262626",
    successColor: "#16A34A",
    errorColor: "#DC2626",
    warningColor: "#EAB308",
  },
  topBar: {
    backgroundColor: "#353535",
    textColor: "#FFFFFF",
    fontSize: "16",
    fontWeight: "700",
    height: "36",
    iconColor: "#FFFFFF",
  },
  header: {
    navTextColor: "#FFFFFF",
    navFontSize: "16",
    navFontWeight: "700",
    navHoverColor: "#FA4860",
    logoColor: "#FA4860",
  },
  sectionHeaders: {
    textColor: "#FFFFFF",
    fontSize: "16",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    lineColor: "#FFFFFF",
    lineHeight: "1",
    backgroundColor: "#000000",
  },
  videoCards: {
    titleColor: "#FFFFFF",
    titleFontSize: "18",
    titleFontWeight: "700",
    metaColor: "#999999",
    metaFontSize: "14",
    hoverAccentColor: "#FA4860",
  },
  performerCards: {
    nameColor: "#E0E0E0",
    nameFontSize: "20",
    nameFontWeight: "400",
    statsColor: "#B3B3B3",
    verifiedColor: "#00aaff",
  },
  ctaBanner: {
    titleColor: "#FFFFFF",
    titleFontSize: "32",
    descriptionColor: "#FFFFFF",
    descriptionFontSize: "18",
    overlayOpacity: "0.4",
  },
  countdown: {
    titleColor: "#FFFFFF",
    titleFontSize: "32",
    subtitleColor: "#FFFFFF",
    numberColor: "#FFFFFF",
    numberFontSize: "48",
    labelColor: "#CCCCCC",
    separatorColor: "#4D4D4D",
  },
  footer: {
    backgroundColor: "#000000",
    titleColor: "#FFFFFF",
    titleFontSize: "18",
    titleFontWeight: "700",
    linkColor: "#FFFFFF",
    linkHoverColor: "#D1D5DB",
    linkFontSize: "14",
    copyrightColor: "#FFFFFF",
    disclaimerLinkColor: "#FA4860",
    borderColor: "#1A1A1A",
    newsletterInputBg: "#262626",
    newsletterButtonBg: "#FA4860",
    socialIconColor: "#FFFFFF",
  },
  forms: {
    inputBg: "#000000",
    inputBorder: "#333333",
    inputText: "#FFFFFF",
    inputFocusBorder: "#FA4860",
    labelColor: "#9CA3AF",
    placeholderColor: "#6B7280",
  },
  cart: {
    itemNameColor: "#FFFFFF",
    itemMetaColor: "#999999",
    priceColor: "#FA4860",
    quantityBorderColor: "#333333",
    quantityButtonHoverBg: "#1A1A1A",
    summaryLabelColor: "#9CA3AF",
    removeButtonColor: "#9CA3AF",
    removeButtonHoverColor: "#DC2626",
    emptyIconColor: "#333333",
    emptyTextColor: "#9CA3AF",
    trustBadgeColor: "#9CA3AF",
  },
  comingSoon: {
    labelBg: "#2D3748",
    labelColor: "#FFFFFF",
    nameBg: "#2D3748",
    nameColor: "#FFFFFF",
    numberColor: "#FFFFFF",
    letterColor: "#9CA3AF",
    buttonBg: "#F4A0AB",
    buttonColor: "#FFFFFF",
  },
  carouselArrows: {
    backgroundColor: "#1A1A1A",
    iconColor: "#FFFFFF",
    borderColor: "#FA4860",
    borderWidth: "2",
    size: "44",
    borderRadius: "50",
    hoverBackgroundColor: "#000000",
  },
  buttons: {
    primary: {
      backgroundColor: "#FA4860",
      textColor: "#FFFFFF",
      borderRadius: "0",
      fontSize: "16",
      fontWeight: "500",
      padding: "10px 28px",
      hoverBackgroundColor: "#E03E54",
      hoverTextColor: "#FFFFFF",
    },
    secondary: {
      backgroundColor: "transparent",
      textColor: "#FA4860",
      borderRadius: "0",
      fontSize: "16",
      fontWeight: "500",
      padding: "10px 28px",
      borderColor: "#FA4860",
      borderWidth: "2",
      hoverBackgroundColor: "#FA4860",
      hoverTextColor: "#FFFFFF",
    },
  },
  variantSelector: {
    selectedBg: "#E03E54",
    selectedText: "#FFFFFF",
    defaultBg: "#f3f4f6",
    defaultText: "#000000",
  },
}

interface ThemeStylesProviderProps {
  children: React.ReactNode
  initialTheme?: Record<string, unknown>
}

export function ThemeStylesProvider({ children, initialTheme }: ThemeStylesProviderProps) {
  const [theme] = React.useState<ThemeSettings>(() => {
    if (initialTheme) {
      return deepMerge(defaultTheme as unknown as Record<string, unknown>, initialTheme) as unknown as ThemeSettings
    }
    return defaultTheme
  })

  const cssVariables = React.useMemo(() => {
    const g = theme.global
    const tb = theme.topBar
    const h = theme.header
    const sh = theme.sectionHeaders
    const vc = theme.videoCards
    const pc = theme.performerCards
    const cta = theme.ctaBanner
    const cd = theme.countdown
    const f = theme.footer
    const fo = theme.forms
    const ca = theme.cart
    const cs = theme.comingSoon
    const ca2 = theme.carouselArrows
    const bp = theme.buttons.primary
    const bs = theme.buttons.secondary
    const vs = theme.variantSelector

    return `
      :root {
        /* Global */
        --global-bg: ${g.backgroundColor};
        --global-font: '${g.fontFamily}', sans-serif;
        --brand-color: ${g.brandColor};
        --brand-color-hover: ${g.brandColorHover};
        --accent-color: ${g.accentColor};
        --text-primary: ${g.textPrimary};
        --text-secondary: ${g.textSecondary};
        --text-muted: ${g.textMuted};
        --link-color: ${g.linkColor};
        --surface-bg: ${g.surfaceBg};
        --border-color: ${g.borderColor};
        --success-color: ${g.successColor};
        --error-color: ${g.errorColor};
        --warning-color: ${g.warningColor};

        /* Top Bar */
        --topbar-bg: ${tb.backgroundColor};
        --topbar-text: ${tb.textColor};
        --topbar-font-size: ${tb.fontSize}px;
        --topbar-font-weight: ${tb.fontWeight};
        --topbar-height: ${tb.height}px;
        --topbar-icon-color: ${tb.iconColor};

        /* Header */
        --header-nav-text: ${h.navTextColor};
        --header-nav-font-size: ${h.navFontSize}px;
        --header-nav-font-weight: ${h.navFontWeight};
        --header-nav-hover: ${h.navHoverColor};
        --header-logo-color: ${h.logoColor};

        /* Section Headers */
        --sh-text: ${sh.textColor};
        --sh-font-size: ${sh.fontSize}px;
        --sh-font-weight: ${sh.fontWeight};
        --sh-text-transform: ${sh.textTransform};
        --sh-letter-spacing: ${sh.letterSpacing};
        --sh-line-color: ${sh.lineColor};
        --sh-line-height: ${sh.lineHeight}px;
        --sh-bg: ${sh.backgroundColor};

        /* Video Cards */
        --vc-title-color: ${vc.titleColor};
        --vc-title-font-size: ${vc.titleFontSize}px;
        --vc-title-font-weight: ${vc.titleFontWeight};
        --vc-meta-color: ${vc.metaColor};
        --vc-meta-font-size: ${vc.metaFontSize}px;
        --vc-hover-accent: ${vc.hoverAccentColor};

        /* Performer Cards */
        --pc-name-color: ${pc.nameColor};
        --pc-name-font-size: ${pc.nameFontSize}px;
        --pc-name-font-weight: ${pc.nameFontWeight};
        --pc-stats-color: ${pc.statsColor};
        --pc-verified-color: ${pc.verifiedColor};

        /* CTA Banner */
        --cta-title-color: ${cta.titleColor};
        --cta-title-size: ${cta.titleFontSize}px;
        --cta-desc-color: ${cta.descriptionColor};
        --cta-desc-size: ${cta.descriptionFontSize}px;
        --cta-overlay-opacity: ${cta.overlayOpacity};

        /* Countdown */
        --cd-title-color: ${cd.titleColor};
        --cd-title-size: ${cd.titleFontSize}px;
        --cd-subtitle-color: ${cd.subtitleColor};
        --cd-number-color: ${cd.numberColor};
        --cd-number-size: ${cd.numberFontSize}px;
        --cd-label-color: ${cd.labelColor};
        --cd-separator-color: ${cd.separatorColor};

        /* Footer */
        --footer-bg: ${f.backgroundColor};
        --footer-title-color: ${f.titleColor};
        --footer-title-size: ${f.titleFontSize}px;
        --footer-title-weight: ${f.titleFontWeight};
        --footer-link-color: ${f.linkColor};
        --footer-link-hover: ${f.linkHoverColor};
        --footer-link-size: ${f.linkFontSize}px;
        --footer-copyright-color: ${f.copyrightColor};
        --footer-disclaimer-link: ${f.disclaimerLinkColor};
        --footer-border-color: ${f.borderColor};
        --footer-newsletter-input-bg: ${f.newsletterInputBg};
        --footer-newsletter-btn-bg: ${f.newsletterButtonBg};
        --footer-social-icon-color: ${f.socialIconColor};

        /* Forms */
        --form-input-bg: ${fo.inputBg};
        --form-input-border: ${fo.inputBorder};
        --form-input-text: ${fo.inputText};
        --form-input-focus-border: ${fo.inputFocusBorder};
        --form-label-color: ${fo.labelColor};
        --form-placeholder-color: ${fo.placeholderColor};

        /* Cart */
        --cart-item-name: ${ca.itemNameColor};
        --cart-item-meta: ${ca.itemMetaColor};
        --cart-price: ${ca.priceColor};
        --cart-qty-border: ${ca.quantityBorderColor};
        --cart-qty-btn-hover: ${ca.quantityButtonHoverBg};
        --cart-summary-label: ${ca.summaryLabelColor};
        --cart-remove-btn: ${ca.removeButtonColor};
        --cart-remove-btn-hover: ${ca.removeButtonHoverColor};
        --cart-empty-icon: ${ca.emptyIconColor};
        --cart-empty-text: ${ca.emptyTextColor};
        --cart-trust-badge: ${ca.trustBadgeColor};

        /* Coming Soon */
        --cs-label-bg: ${cs.labelBg};
        --cs-label-color: ${cs.labelColor};
        --cs-name-bg: ${cs.nameBg};
        --cs-name-color: ${cs.nameColor};
        --cs-number-color: ${cs.numberColor};
        --cs-letter-color: ${cs.letterColor};
        --cs-button-bg: ${cs.buttonBg};
        --cs-button-color: ${cs.buttonColor};

        /* Carousel Arrows */
        --carousel-arrow-bg: ${ca2.backgroundColor};
        --carousel-arrow-icon: ${ca2.iconColor};
        --carousel-arrow-border: ${ca2.borderColor};
        --carousel-arrow-border-width: ${ca2.borderWidth}px;
        --carousel-arrow-size: ${ca2.size}px;
        --carousel-arrow-radius: ${ca2.borderRadius}%;
        --carousel-arrow-hover-bg: ${ca2.hoverBackgroundColor};

        /* Primary Button */
        --btn-primary-bg: ${bp.backgroundColor};
        --btn-primary-text: ${bp.textColor};
        --btn-primary-radius: ${bp.borderRadius}px;
        --btn-primary-font-size: ${bp.fontSize}px;
        --btn-primary-font-weight: ${bp.fontWeight};
        --btn-primary-padding: ${bp.padding};
        --btn-primary-hover-bg: ${bp.hoverBackgroundColor};
        --btn-primary-hover-text: ${bp.hoverTextColor};

        /* Secondary Button */
        --btn-secondary-bg: ${bs.backgroundColor};
        --btn-secondary-text: ${bs.textColor};
        --btn-secondary-radius: ${bs.borderRadius}px;
        --btn-secondary-font-size: ${bs.fontSize}px;
        --btn-secondary-font-weight: ${bs.fontWeight};
        --btn-secondary-padding: ${bs.padding};
        --btn-secondary-border-color: ${bs.borderColor || "#FA4860"};
        --btn-secondary-border-width: ${bs.borderWidth || "2"}px;
        --btn-secondary-hover-bg: ${bs.hoverBackgroundColor};
        --btn-secondary-hover-text: ${bs.hoverTextColor};

        /* Variant Selector */
        --variant-selected-bg: ${vs.selectedBg};
        --variant-selected-text: ${vs.selectedText};
        --variant-default-bg: ${vs.defaultBg};
        --variant-default-text: ${vs.defaultText};
      }

      /* Global body styles - applies theme bg/text to all pages */
      body {
        background-color: var(--global-bg);
        color: var(--text-primary);
        font-family: var(--global-font);
      }

      /* Global placeholder color */
      input::placeholder,
      textarea::placeholder {
        color: var(--form-placeholder-color) !important;
        opacity: 1;
      }

      /* Global button styles */
      .btn-primary {
        background-color: var(--btn-primary-bg) !important;
        color: var(--btn-primary-text) !important;
        border-radius: var(--btn-primary-radius) !important;
        font-size: var(--btn-primary-font-size) !important;
        font-weight: var(--btn-primary-font-weight) !important;
        padding: var(--btn-primary-padding) !important;
        font-family: var(--global-font) !important;
        border: none !important;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-primary:hover:not(:disabled) {
        background-color: var(--btn-primary-hover-bg) !important;
        color: var(--btn-primary-hover-text) !important;
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-secondary {
        background-color: var(--btn-secondary-bg) !important;
        color: var(--btn-secondary-text) !important;
        border-radius: var(--btn-secondary-radius) !important;
        font-size: var(--btn-secondary-font-size) !important;
        font-weight: var(--btn-secondary-font-weight) !important;
        padding: var(--btn-secondary-padding) !important;
        font-family: var(--global-font) !important;
        border: var(--btn-secondary-border-width) solid var(--btn-secondary-border-color) !important;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-secondary:hover:not(:disabled) {
        background-color: var(--btn-secondary-hover-bg) !important;
        color: var(--btn-secondary-hover-text) !important;
      }

      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `
  }, [theme])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      {children}
    </>
  )
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result = { ...target } as Record<string, unknown>
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      result[key] &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>)
    } else {
      result[key] = source[key]
    }
  }
  return result as T
}
