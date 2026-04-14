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

// Validation schemas with Zod
const profileSchema = z.object({
  nombre: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
})

const passwordSchema = z
  .object({
    actual: z.string().min(1, "Current password is required"),
    nueva: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/\d/, "Must contain at least one number"),
    confirmar: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.nueva === data.confirmar, {
    message: "Passwords do not match",
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
      router.push("/?login=true")
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
    { text: "At least 8 characters", met: passwordData.nueva.length >= 8 },
    {
      text: "Contains uppercase and lowercase letters",
      met: /[a-z]/.test(passwordData.nueva) && /[A-Z]/.test(passwordData.nueva),
    },
    { text: "Contains at least one number", met: /\d/.test(passwordData.nueva) },
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
      toast.error("Please fix the form errors")
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
        toast.success("Profile updated successfully")
        await update()
      } else {
        const data = await res.json()
        if (data.error === "Username already taken") {
          setFormErrors({ ...formErrors, username: "This username is already taken" })
          toast.error("This username is already taken")
        } else {
          toast.error(data.error || "Error updating profile")
        }
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Error saving changes")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      toast.error("Please fix the form errors")
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
        toast.success("Password updated successfully")
        setPasswordData({ actual: "", nueva: "", confirmar: "" })
        setPasswordErrors({})
      } else {
        const data = await res.json()
        if (data.error === "Current password is incorrect") {
          setPasswordErrors({ ...passwordErrors, actual: "Current password is incorrect" })
          toast.error("Current password is incorrect")
        } else {
          toast.error(data.error || "Error changing password")
        }
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Error changing password")
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
        toast.success("Notification preferences updated")
      } else {
        toast.error("Error saving preferences")
      }
    } catch (error) {
      console.error("Error saving notifications:", error)
      toast.error("Error saving preferences")
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image cannot exceed 2MB")
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
        throw new Error(errorData.error || "Error uploading image")
      }

      const uploadResult = await uploadRes.json()

      if (uploadResult?.url) {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: uploadResult.url }),
        })

        if (res.ok) {
          toast.success("Profile photo updated")
          await update()
          setPhotoModalOpen(false)
          setPreviewImage(null)
          setSelectedFile(null)
        } else {
          toast.error("Error saving image")
        }
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      toast.error("Error uploading image")
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
        toast.success("Profile photo removed")
        await update()
        setPhotoModalOpen(false)
        setPreviewImage(null)
        setSelectedFile(null)
      } else {
        toast.error("Error removing image")
      }
    } catch (error) {
      console.error("Error removing photo:", error)
      toast.error("Error removing image")
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
    return new Date(dateString).toLocaleDateString("en-US", {
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
    <div className="flex-1 flex flex-col font-sans" style={{ backgroundColor: "var(--global-bg)", color: "var(--text-primary)" }}>
      <div className="flex flex-col flex-1 pt-8 pb-12">
        <AccountNav />

        {/* Personal Information */}
        <div className="mt-8 w-full">
          <h2 className="font-[Montserrat] text-[20px] font-semibold leading-[28px] mb-2" style={{ color: "var(--text-primary)" }}>
            Personal Information
          </h2>
          <p className="font-[Montserrat] text-[16px] font-normal leading-[24px] mb-8" style={{ color: "var(--text-primary)" }}>
            Update your personal details and profile information
          </p>

          <div className="border border-white p-8">
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <Avatar className="w-[100px] h-[100px] border-[3px] border-[#00B1DE]">
                  <AvatarImage
                    src={session?.user?.image || undefined}
                    alt="Profile photo"
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
                      Change Photo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-700 text-white sm:max-w-md rounded-none">
                    <DialogHeader>
                      <DialogTitle style={{ color: "var(--text-primary)" }}>Change profile photo</DialogTitle>
                      <DialogDescription style={{ color: "var(--text-muted)" }}>
                        Upload a new image or remove the current one
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-6 py-4">
                      <Avatar className="w-32 h-32 border-4 border-[#00B1DE]">
                        <AvatarImage
                          src={previewImage || session?.user?.image || undefined}
                          alt="Preview"
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
                          Select image
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
                            Remove current photo
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
                        Cancel
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
                          Save
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nombre" style={{ color: "var(--text-primary)" }}>
                      Name
                    </Label>
                    <input
                      id="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleFormChange("nombre", e.target.value)}
                      className={`${inputBaseStyles} ${formErrors.nombre ? inputErrorStyles : inputNormalStyles}`}
                      placeholder="Your name"
                    />
                    {formErrors.nombre && (
                      <span className="text-red-500 text-xs">{formErrors.nombre}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="username" style={{ color: "var(--text-primary)" }}>
                      Username
                    </Label>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleFormChange("username", e.target.value)}
                      className={`${inputBaseStyles} ${formErrors.username ? inputErrorStyles : inputNormalStyles}`}
                      placeholder="Your username"
                    />
                    {formErrors.username && (
                      <span className="text-red-500 text-xs">{formErrors.username}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" style={{ color: "var(--text-primary)" }}>
                    Email
                  </Label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className={`${inputBaseStyles} bg-zinc-200 text-zinc-500 cursor-not-allowed border-zinc-300`}
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Email cannot be changed</span>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="bio" style={{ color: "var(--text-primary)" }}>
                    Bio
                  </Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleFormChange("bio", e.target.value)}
                    className={`${inputBaseStyles} resize-none ${formErrors.bio ? inputErrorStyles : inputNormalStyles}`}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                  {formErrors.bio && (
                    <span className="text-red-500 text-xs">{formErrors.bio}</span>
                  )}
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formData.bio.length}/500 characters</span>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="self-start bg-[#FA4860] hover:bg-[#e8415a] text-white px-8 rounded-none"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Password & Security */}
        <div className="mt-8 w-full">
          <h2 className="font-[Montserrat] text-[20px] font-semibold leading-[28px] mb-2" style={{ color: "var(--text-primary)" }}>
            Password & Security
          </h2>
          <p className="font-[Montserrat] text-[16px] font-normal leading-[24px] mb-8" style={{ color: "var(--text-primary)" }}>
            Manage your password and security settings
          </p>

          <div className="border border-zinc-700 p-8">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password-actual" style={{ color: "var(--text-primary)" }}>
                    Current Password
                  </Label>
                  <input
                    id="password-actual"
                    type="password"
                    value={passwordData.actual}
                    onChange={(e) => handlePasswordChange("actual", e.target.value)}
                    className={`${inputBaseStyles} ${passwordErrors.actual ? inputErrorStyles : inputNormalStyles}`}
                    placeholder="Enter current password"
                  />
                  {passwordErrors.actual && (
                    <span className="text-red-500 text-xs">{passwordErrors.actual}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password-nueva" style={{ color: "var(--text-primary)" }}>
                    New Password
                  </Label>
                  <input
                    id="password-nueva"
                    type="password"
                    value={passwordData.nueva}
                    onChange={(e) => handlePasswordChange("nueva", e.target.value)}
                    className={`${inputBaseStyles} ${passwordErrors.nueva ? inputErrorStyles : inputNormalStyles}`}
                    placeholder="Enter new password"
                  />
                  {passwordErrors.nueva && (
                    <span className="text-red-500 text-xs">{passwordErrors.nueva}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password-confirmar" style={{ color: "var(--text-primary)" }}>
                    Confirm Password
                  </Label>
                  <input
                    id="password-confirmar"
                    type="password"
                    value={passwordData.confirmar}
                    onChange={(e) => handlePasswordChange("confirmar", e.target.value)}
                    className={`${inputBaseStyles} ${passwordErrors.confirmar ? inputErrorStyles : inputNormalStyles}`}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirmar && (
                    <span className="text-red-500 text-xs">{passwordErrors.confirmar}</span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-[Montserrat] text-[16px] font-medium mb-4" style={{ color: "var(--text-primary)" }}>
                  Password Requirements:
                </h4>
                <ul className="flex flex-col gap-2">
                  {passwordRequirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-3">
                      {req.met ? (
                        <IconCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <IconX className="w-4 h-4 text-[#FA4860]" />
                      )}
                      <span className="font-[Montserrat] text-[14px] font-normal leading-[20px]" style={{ color: "var(--text-primary)" }}>
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
                {savingPassword ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="mt-8 w-full">
          <h2 className="font-[Montserrat] text-[20px] font-semibold leading-normal mb-8" style={{ color: "var(--text-primary)" }}>
            Subscription Management
          </h2>

          {subscriptionData?.plan && (
            <div className="border border-zinc-700 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Current plan</p>
                  <p className="text-xl font-semibold text-[#FA4860]">
                    {subscriptionData.plan.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-sm">Valid until</p>
                  <p className="text-white font-medium" style={{ color: "var(--text-primary)" }}>{formatDate(subscriptionData.end)}</p>
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
                  <h3 className="font-[Montserrat] text-[16px] font-semibold leading-[24px]" style={{ color: "var(--text-primary)" }}>
                    Renew early
                  </h3>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Extend your subscription now
                  </p>
                </div>
              </div>
              <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-300 mb-6">
                Renew your subscription early to ensure uninterrupted service. Your new billing cycle
                will start immediately.
              </p>
              <Button
                className="w-full bg-[#FA4860] text-white font-semibold py-3 hover:bg-[#e8415a] rounded-none"
                onClick={() => router.push("/my-account/subscription")}
              >
                Renew Now
              </Button>
            </div>

            <div className="border border-zinc-700 p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-[48px] h-[48px] bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                  <IconX className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-[Montserrat] text-[16px] font-semibold leading-[24px]" style={{ color: "var(--text-primary)" }}>
                    Cancel subscription
                  </h3>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    End your subscription
                  </p>
                </div>
              </div>
              <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-300 mb-6">
                Cancel your subscription at any time. You will continue to have access until the end of your current
                billing period.
              </p>
              <Button
                variant="outline"
                className="w-full border-[#FA4860] bg-transparent text-[#FA4860] font-semibold py-3 hover:bg-[#FA4860]/10 rounded-none"
                onClick={() => toast.info("Contact support to cancel your subscription")}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="mt-8 w-full">
          <div className="flex items-center gap-3 mb-2">
            <IconBell className="w-6 h-6 text-[#00B1DE]" />
            <h2 className="font-[Montserrat] text-[20px] font-semibold leading-[28px]" style={{ color: "var(--text-primary)" }}>
              Notification Preferences
            </h2>
          </div>
          <p className="font-[Montserrat] text-[16px] font-normal leading-[24px] mb-8" style={{ color: "var(--text-primary)" }}>
            Choose how you want to be notified
          </p>

          <div className="border border-zinc-700 p-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-[Montserrat] text-[16px] font-medium leading-[24px]" style={{ color: "var(--text-primary)" }}>
                    Email Notifications
                  </h4>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-[Montserrat] text-[16px] font-medium leading-[24px]" style={{ color: "var(--text-primary)" }}>
                    New Content Alerts
                  </h4>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Get notified when new content is available
                  </p>
                </div>
                <Switch
                  checked={notifications.newContent}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, newContent: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-[Montserrat] text-[16px] font-medium leading-[24px]" style={{ color: "var(--text-primary)" }}>
                    Subscription Reminders
                  </h4>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Reminders about subscription renewals
                  </p>
                </div>
                <Switch
                  checked={notifications.subscription}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, subscription: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-[Montserrat] text-[16px] font-medium leading-[24px]" style={{ color: "var(--text-primary)" }}>
                    Marketing Communications
                  </h4>
                  <p className="font-[Montserrat] text-[14px] font-normal leading-[20px] text-zinc-400">
                    Promotional offers and updates
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
                {savingNotifications ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
