"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconSettings, IconShieldCheck, IconLock, IconMail } from "@tabler/icons-react"
import { GeneralSettings } from "./general-settings"
import { AgeVerificationSettings } from "./age-verification-settings"
import { VideoAccessSettings } from "./video-access-settings"
import { EmailSettings } from "./email-settings"

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
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <IconSettings className="size-4" />
            General
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
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
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
      </Tabs>
    </div>
  )
}
