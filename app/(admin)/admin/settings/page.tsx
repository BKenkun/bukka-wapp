import { GeneralSettings } from "./general-settings"

export default function SettingsPage() {
  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Configura las opciones de la plataforma
        </p>
      </div>

      <GeneralSettings />
    </div>
  )
}
