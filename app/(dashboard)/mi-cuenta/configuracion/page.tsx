"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AccountNav } from "@/components/account-nav"
import { toast } from "sonner"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { IconCamera, IconCheck, IconX, IconLoader2, IconBell, IconRefresh } from "@tabler/icons-react"

// Schemas de validación con Zod
const profileSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar 100 caracteres"),
  username: z
    .string()
    .min(3, "El username debe tener al menos 3 caracteres")
    .max(30, "El username no puede superar 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guiones bajos")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "La bio no puede superar 500 caracteres")
    .optional()
    .or(z.literal("")),
})

const passwordSchema = z
  .object({
    actual: z.string().min(1, "La contraseña actual es obligatoria"),
    nueva: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/\d/, "Debe contener al menos un número"),
    confirmar: z.string().min(1, "Confirma la nueva contraseña"),
  })
  .refine((data) => data.nueva === data.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  })

interface UserData {
  id: string
  email: string
  name: string | null
  username: string | null
  image: string | null
  bio: string | null
  subscriptionPlan: {
    id: string
    slug: string
    name: string
    level: number
    color: string
  } | null
  subscriptionStart: string | null
  subscriptionEnd: string | null
  notifyEmail: boolean
  notifyNewContent: boolean
  notifySubscription: boolean
  notifyMarketing: boolean
}

interface FormErrors {
  nombre?: string
  username?: string
  bio?: string
}

interface PasswordErrors {
  actual?: string
  nueva?: string
  confirmar?: string
}

export default function ConfiguracionPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    username: "",
    bio: "",
  })

  const [passwordData, setPasswordData] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  })

  const [notifications, setNotifications] = useState({
    email: true,
    newContent: true,
    subscription: false,
    marketing: false,
  })

  const [subscriptionData, setSubscriptionData] = useState<{
    plan: UserData["subscriptionPlan"]
    start: string | null
    end: string | null
  } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/user")
        if (res.ok) {
          const data = await res.json()
          const user: UserData = data.user
          setFormData({
            nombre: user.name || "",
            email: user.email || "",
            username: user.username || "",
            bio: user.bio || "",
          })
          setNotifications({
            email: user.notifyEmail,
            newContent: user.notifyNewContent,
            subscription: user.notifySubscription,
            marketing: user.notifyMarketing,
          })
          setSubscriptionData({
            plan: user.subscriptionPlan,
            start: user.subscriptionStart,
            end: user.subscriptionEnd,
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    if (session?.user) {
      fetchUserData()
    }
  }, [session])

  const passwordRequirements = [
    { text: "Mínimo 8 caracteres de longitud", met: passwordData.nueva.length >= 8 },
    {
      text: "Contiene letras mayúsculas y minúsculas",
      met: /[a-z]/.test(passwordData.nueva) && /[A-Z]/.test(passwordData.nueva),
    },
    { text: "Contiene al menos un número", met: /\d/.test(passwordData.nueva) },
  ]

  const validateProfile = () => {
    const result = profileSchema.safeParse(formData)
    if (!result.success) {
      const errors: FormErrors = {}
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors
        errors[field] = err.message
      })
      setFormErrors(errors)
      return false
    }
    setFormErrors({})
    return true
  }

  const validatePassword = () => {
    const result = passwordSchema.safeParse(passwordData)
    if (!result.success) {
      const errors: PasswordErrors = {}
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof PasswordErrors
        errors[field] = err.message
      })
      setPasswordErrors(errors)
      return false
    }
    setPasswordErrors({})
    return true
  }

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      toast.error("Por favor corrige los errores del formulario")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.nombre,
          username: formData.username || undefined,
          bio: formData.bio || null,
        }),
      })

      if (res.ok) {
        toast.success("Perfil actualizado correctamente")
        await update()
      } else {
        const data = await res.json()
        if (data.error === "Username already taken") {
          setFormErrors({ ...formErrors, username: "Este username ya está en uso" })
          toast.error("Este username ya está en uso")
        } else {
          toast.error(data.error || "Error al actualizar el perfil")
        }
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Error al guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      toast.error("Por favor corrige los errores del formulario")
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.actual,
          newPassword: passwordData.nueva,
          confirmPassword: passwordData.confirmar,
        }),
      })

      if (res.ok) {
        toast.success("Contraseña actualizada correctamente")
        setPasswordData({ actual: "", nueva: "", confirmar: "" })
        setPasswordErrors({})
      } else {
        const data = await res.json()
        if (data.error === "Current password is incorrect") {
          setPasswordErrors({ ...passwordErrors, actual: "La contraseña actual es incorrecta" })
          toast.error("La contraseña actual es incorrecta")
        } else {
          toast.error(data.error || "Error al cambiar la contraseña")
        }
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Error al cambiar la contraseña")
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSavingNotifications(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyEmail: notifications.email,
          notifyNewContent: notifications.newContent,
          notifySubscription: notifications.subscription,
          notifyMarketing: notifications.marketing,
        }),
      })

      if (res.ok) {
        toast.success("Preferencias de notificación actualizadas")
      } else {
        toast.error("Error al guardar las preferencias")
      }
    } catch (error) {
      console.error("Error saving notifications:", error)
      toast.error("Error al guardar las preferencias")
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen no puede superar 2MB")
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadPhoto = async () => {
    if (!selectedFile) return

    setUploadingPhoto(true)
    try {
      // Upload to local storage
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("folder", "avatars")

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al subir imagen")
      }

      const uploadResult = await uploadRes.json()

      if (uploadResult?.url) {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: uploadResult.url }),
        })

        if (res.ok) {
          toast.success("Foto de perfil actualizada")
          await update()
          setPhotoModalOpen(false)
          setPreviewImage(null)
          setSelectedFile(null)
        } else {
          toast.error("Error al guardar la imagen")
        }
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      toast.error("Error al subir la imagen")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      })

      if (res.ok) {
        toast.success("Foto de perfil eliminada")
        await update()
        setPhotoModalOpen(false)
        setPreviewImage(null)
        setSelectedFile(null)
      } else {
        toast.error("Error al eliminar la imagen")
      }
    } catch (error) {
      console.error("Error removing photo:", error)
      toast.error("Error al eliminar la imagen")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const closePhotoModal = () => {
    setPhotoModalOpen(false)
    setPreviewImage(null)
    setSelectedFile(null)
  }

  const getUserInitials = () => {
    const name = session?.user?.name || formData.nombre || "U"
    return name.slice(0, 2).toUpperCase()
  }

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors({ ...formErrors, [field]: undefined })
    }
  }

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData({ ...passwordData, [field]: value })
    if (passwordErrors[field as keyof PasswordErrors]) {
      setPasswordErrors({ ...passwordErrors, [field]: undefined })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const inputBaseStyles =
    "w-full border bg-white text-black text-base px-4 py-3 placeholder:text-zinc-400 outline-none transition-colors rounded-none"
  const inputErrorStyles = "border-red-500 focus:border-red-500"
  const inputNormalStyles = "border-zinc-300 focus:border-[#FA4860]"

  return (
    <div className="flex-1 flex flex-col font-sans bg-black text-white">
      <div className="flex flex-col flex-1 px-4 md:px-8 pt-8 pb-12">
        <AccountNav />

        {/* Información Personal */}
        <div className="mt-8 w-full">
          <h2 className="font-[Montserrat] text-[20px] font-semibold leading-[28px] text-white mb-2">
            Información Personal
          </h2>
          <p className="font-[Montserrat] text-[16px] font-normal leading-[24px] text-white mb-8">
            Actualiza tus datos personales e información de perfil
          </p>

          <div className="border border-white p-8">
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <Avatar className="w-[100px] h-[100px] border-[3px] border-[#00B1DE]">
                  <AvatarImage
                    src={session?.user?.image || undefined}
                    alt="Foto de perfil"
                  />
                  <AvatarFallback className="bg-zinc-800 text-white text-2xl">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>

                <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="link"
                      className="text-[#FA4860] hover:text-[#FA4860]/80 p-0 h-auto font-[Montserrat] text-[14px]"
                    >
                      Cambiar Foto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-700 text-white sm:max-w-md rounded-none">
                    <DialogHeader>
                      <DialogTitle className="text-white">Cambiar foto de perfil</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Sube una nueva imagen o elimina la actual
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-6 py-4">
                      <Avatar className="w-32 h-32 border-4 border-[#00B1DE]">
                        <AvatarImage
                          src={previewImage || session?.user?.image || undefined}
                          alt="Vista previa"
                        />
                        <AvatarFallback className="bg-zinc-800 text-white text-3xl">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <div className="flex flex-col gap-3 w-full">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-transparent border-zinc-600 text-white hover:bg-zinc-800 rounded-none"
                          disabled={uploadingPhoto}
                        >
                          <IconCamera className="w-4 h-4 mr-2" />
                          Seleccionar imagen
                        </Button>

                        {session?.user?.image && !previewImage && (
                          <Button
                            variant="destructive"
                            onClick={handleRemovePhoto}
                            className="w-full rounded-none"
                            disabled={uploadingPhoto}
                          >
                            {uploadingPhoto ? (
                              <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <IconX className="w-4 h-4 mr-2" />
                            )}
                            Eliminar foto actual
                          </Button>
                        )}
                      </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={closePhotoModal}
                        className="bg-transparent border-zinc-600 text-white hover:bg-zinc-800 rounded-none"
                        disabled={uploadingPhoto}
                      >
                        Cancelar
                      </Button>
                      {previewImage && (
                        <Button
                          onClick={handleUploadPhoto}
                          className="bg-[#FA4860] hover:bg-[#e8415a] text-white rounded-none"
                          disabled={uploadingPhoto}
                        >
                          {uploadingPhoto ? (
                            <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <IconCheck className="w-4 h-4 mr-2" />
                          )}
                          Guardar
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nombre" className="text-white">
                      Nombre
                    </Label>
                    <input
                      id="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleFormChange("nombre", e.target.value)}
                      className={`${inputBaseStyles} ${formErrors.nombre ? inputErrorStyles : inputNormalStyles}`}
                      placeholder="Tu nombre"
                    />
                    {formErrors.nombre && (
                      <span className="text-red-500 text-xs">{formErrors.nombre}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="username" className="text-white">
                      Username
                    </Label>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleFormChange("username", e.target.value)}
                      className={`${inputBaseStyles} ${formErrors.username ? inputErrorStyles : inputNormalStyles}`}
                      placeholder="Tu username"
                    />
                    {formErrors.username && (
                      <span className="text-red-500 text-xs">{formErrors.username}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className={`${inputBaseStyles} bg-zinc-200 text-zinc-500 cursor-not-allowed border-zinc-300`}
                  />
                  <span className="text-zinc-500 text-xs">El email no se puede cambiar</span>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="bio" className="text-white">
                    Bio
                  </Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleFormChange("bio", e.target.value)}
                    className={`${inputBaseStyles} resize-none ${formErrors.bio ? inputErrorStyles : inputNormalStyles}`}
                    placeholder="Cuéntanos sobre ti..."
                    rows={3}
                  />
                  {formErrors.bio && (
                    <span className="text-red-500 text-xs">{formErrors.bio}</span>
                  )}
                  <span className="text-zinc-500 text-xs">{formData.bio.length}/500 caracteres</span>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="self-start bg-[#FA4860] hover:bg-[#e8415a] text-white px-8 rounded-none"
                >
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contraseña y Seguridad */}
        <div className="mt-8 w-full">
          <h2 className="font-[Montserrat] text-[20px] font-semibold leading-[28px] text-white mb-2">
            Contraseña y Seguridad
          </h2>
          <p className="font-[Montserrat] text-[16px] font-normal leading-[24px] text-white mb-8">
            Gestiona tu contraseña y configuraciones de seguridad
          </p>

          <div className="border border-zinc-700 p-8">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password-actual" className="text-white">
                    Contraseña Actual
                  </Label>
                  <input
                    id="password-actual"
                    type="password"
                    value={passwordData.actual}
                    onChange={(e) => handlePasswordChange("actual", e.target.value)}
                    className={`${inputBaseStyles} ${passwordErrors.actual ? inputErrorStyles : inputNormalStyles}`}
                    placeholder="Introduce la contraseña actual"
                  />
                  {passwordErrors.actual && (
                    <span className="text-red-500 text-xs">{passwordErrors.actual}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password-nueva" className="text-white">
                    Nueva Contraseña
                  </Label>
                  <input
                    id="password-nueva"
                    type="password"
                    value={passwordData.nueva}
                    onChange={(e) => handlePasswordChange("nueva", e.target.value)}
                    className={`${inputBaseStyles} ${passwordErrors.nueva ? inputErrorStyles : inputNormalStyles}`}
                    placeholder="Introduce nueva contraseña"
                  />
                  {passwordErrors.nueva && (
                    <span className="text-red-500 text-xs">{passwordErrors.nueva}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password-confirmar" className="text-white">
                    Confirmar Contraseña
                  </Label>
                  <input
                    id="password-confirmar"
                    type="password"
                    value={passwordData.confirmar}
                    onChange={(e) => handlePasswordChange("confirmar", e.target.value)}
                    className={`${inputBaseStyles} ${passwordErrors.confirmar ? inputErrorStyles : inputNormalStyles}`}
                    placeholder="Confirma nueva contraseña"
                  />
                  {passwordErrors.confirmar && (
                    <span className="text-red-500 text-xs">{passwordErrors.confirmar}</span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-[Montserrat] text-[16px] font-medium text-white mb-4">
                  Requisitos de Contraseña:
                </h4>
                <ul className="flex flex-col gap-2">
                  {passwordRequirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-3">
                      {req.met ? (
                        <IconCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <IconX className="w-4 h-4 text-[#FA4860]" />
                      )}
                      <span className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-white">
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={savingPassword || !passwordData.actual || !passwordData.nueva || !passwordData.confirmar}
                className="self-start bg-[#FA4860] hover:bg-[#e8415a] text-white px-8 rounded-none"
              >
                {savingPassword ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </div>
          </div>
        </div>

        {/* Gestión de suscripción */}
        <div className="mt-8 w-full">
          <h2 className="font-[Montserrat] text-[20px] font-semibold leading-normal text-white mb-8">
            Gestión de suscripción
          </h2>

          {subscriptionData?.plan && (
            <div className="border border-zinc-700 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Plan actual</p>
                  <p className="text-xl font-semibold text-[#FA4860]">
                    {subscriptionData.plan.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-sm">Válido hasta</p>
                  <p className="text-white font-medium">{formatDate(subscriptionData.end)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="border border-zinc-700 p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-[48px] h-[48px] bg-[#E0F7FA] flex items-center justify-center flex-shrink-0">
                  <IconRefresh className="w-6 h-6 text-[#00B1DE]" />
                </div>
                <div>
                  <h3 className="font-[Montserrat] text-[16px] font-semibold leading-[24px] text-white">
                    Renovar anticipadamente
                  </h3>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Extiende tu suscripción ahora
                  </p>
                </div>
              </div>
              <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-300 mb-6">
                Renueva tu suscripción anticipadamente para asegurar un servicio ininterrumpido. Tu nuevo ciclo de
                facturación comenzará de inmediato.
              </p>
              <Button
                className="w-full bg-[#FA4860] text-white font-semibold py-3 hover:bg-[#e8415a] rounded-none"
                onClick={() => router.push("/mi-cuenta/suscripcion")}
              >
                Renovar Ahora
              </Button>
            </div>

            <div className="border border-zinc-700 p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-[48px] h-[48px] bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                  <IconX className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-[Montserrat] text-[16px] font-semibold leading-[24px] text-white">
                    Cancelar suscripción
                  </h3>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Finaliza tu suscripción
                  </p>
                </div>
              </div>
              <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-300 mb-6">
                Cancela tu suscripción en cualquier momento. Seguirás teniendo acceso hasta el final de tu período de
                facturación actual.
              </p>
              <Button
                variant="outline"
                className="w-full border-[#FA4860] bg-transparent text-[#FA4860] font-semibold py-3 hover:bg-[#FA4860]/10 rounded-none"
                onClick={() => toast.info("Contacta a soporte para cancelar tu suscripción")}
              >
                Cancelar Suscripción
              </Button>
            </div>
          </div>
        </div>

        {/* Preferencias de Notificación */}
        <div className="mt-8 w-full">
          <div className="flex items-center gap-3 mb-2">
            <IconBell className="w-6 h-6 text-[#00B1DE]" />
            <h2 className="font-[Montserrat] text-[20px] font-semibold leading-[28px] text-white">
              Preferencias de Notificación
            </h2>
          </div>
          <p className="font-[Montserrat] text-[16px] font-normal leading-[24px] text-white mb-8">
            Elige cómo deseas ser notificado
          </p>

          <div className="border border-zinc-700 p-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-[Montserrat] text-[16px] font-medium leading-[24px] text-white">
                    Notificaciones por Correo Electrónico
                  </h4>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Recibe actualizaciones por correo electrónico
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-[Montserrat] text-[16px] font-medium leading-[24px] text-white">
                    Alertas de Nuevo Contenido
                  </h4>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Recibe notificaciones cuando haya nuevo contenido disponible
                  </p>
                </div>
                <Switch
                  checked={notifications.newContent}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, newContent: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-[Montserrat] text-[16px] font-medium leading-[24px] text-white">
                    Recordatorios de Suscripción
                  </h4>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Recordatorios sobre renovaciones de suscripción
                  </p>
                </div>
                <Switch
                  checked={notifications.subscription}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, subscription: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-[Montserrat] text-[16px] font-medium leading-[24px] text-white">
                    Comunicaciones de Marketing
                  </h4>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Ofertas promocionales y actualizaciones
                  </p>
                </div>
                <Switch
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                />
              </div>

              <Button
                onClick={handleSaveNotifications}
                disabled={savingNotifications}
                className="self-start bg-[#FA4860] hover:bg-[#e8415a] text-white px-8 rounded-none mt-4"
              >
                {savingNotifications ? "Guardando..." : "Guardar Preferencias"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
