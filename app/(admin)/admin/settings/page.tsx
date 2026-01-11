import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentGatewaysSettings } from "./payment-gateways-settings"
import { GeneralSettings } from "./general-settings"
import { AgeVerificationSettings } from "./age-verification-settings"

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
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="age-verification">Verificación de Edad</TabsTrigger>
          <TabsTrigger value="payment">Pasarelas de Pago</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="age-verification">
          <AgeVerificationSettings />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentGatewaysSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
