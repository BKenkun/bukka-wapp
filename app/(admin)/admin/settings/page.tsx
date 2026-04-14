"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconSettings, IconShieldCheck, IconLock, IconMail, IconLayoutBottombar, IconPalette, IconPlaylist, IconShoppingBag, IconSearch, IconSpeakerphone, IconMessageCircle } from "@tabler/icons-react"
import { GeneralSettings } from "./general-settings"
import { AgeVerificationSettings } from "./age-verification-settings"
import { VideoAccessSettings } from "./video-access-settings"
import { EmailSettings } from "./email-settings"
import { FooterSettings } from "./footer-settings"
import { ThemeSettings } from "./theme-settings"
import { SystemCollectionsSettings } from "./system-collections-settings"
import { ProductSettings } from "./shop-settings"
import { SearchSettings } from "./search-settings"
import { DiscountBannerSettings } from "./discount-banner-settings"
import { ContactSettings } from "./contact-settings"

export default function SettingsPage() {
  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Configura las opciones de la plataforma
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general" className="gap-2">
            <IconSettings className="size-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <IconPalette className="size-4" />
            Diseño
          </TabsTrigger>
          <TabsTrigger value="age-verification" className="gap-2">
            <IconShieldCheck className="size-4" />
            Verificación de Edad
          </TabsTrigger>
          <TabsTrigger value="video-access" className="gap-2">
            <IconLock className="size-4" />
            Acceso a Videos
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <IconMail className="size-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-2">
            <IconLayoutBottombar className="size-4" />
            Footer
          </TabsTrigger>
          <TabsTrigger value="shop" className="gap-2">
            <IconShoppingBag className="size-4" />
            Producto
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <IconSearch className="size-4" />
            Buscador
          </TabsTrigger>
          <TabsTrigger value="banners" className="gap-2">
            <IconSpeakerphone className="size-4" />
            Banners
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <IconMessageCircle className="size-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="collections" className="gap-2">
            <IconPlaylist className="size-4" />
            Colecciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="design">
          <ThemeSettings />
        </TabsContent>

        <TabsContent value="age-verification">
          <AgeVerificationSettings />
        </TabsContent>

        <TabsContent value="video-access">
          <VideoAccessSettings />
        </TabsContent>

        <TabsContent value="email">
          <EmailSettings />
        </TabsContent>

        <TabsContent value="footer">
          <FooterSettings />
        </TabsContent>

        <TabsContent value="shop">
          <ProductSettings />
        </TabsContent>

        <TabsContent value="search">
          <SearchSettings />
        </TabsContent>

        <TabsContent value="banners">
          <DiscountBannerSettings />
        </TabsContent>

        <TabsContent value="contact">
          <ContactSettings />
        </TabsContent>

        <TabsContent value="collections">
          <SystemCollectionsSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
