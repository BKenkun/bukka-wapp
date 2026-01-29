"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Clock } from "@/components/icons"
import { toast } from "sonner"
import { castingFormSchema } from "@/lib/validations/casting"

export default function CastingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    email: "",
    phone: "",
    gender: "",
    height: "",
    weight: "",
    bust: "",
    waist: "",
    hips: "",
    hairColor: "",
    eyeColor: "",
    skinTone: "",
    tattoos: "",
    experience: "",
    additionalInfo: "",
    socialMedia: "",
    socialMedia2: "",
  })

  const [files, setFiles] = useState<{
    dniPhoto: File | null
    generalPhotos: File[]
    presentationVideo: File | null
  }>({
    dniPhoto: null,
    generalPhotos: [],
    presentationVideo: null,
  })

  // Local upload function
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Error al subir archivo")
    }

    const result = await response.json()
    return result.url
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    if (fieldName === "generalPhotos") {
      setFiles(prev => ({
        ...prev,
        generalPhotos: Array.from(selectedFiles),
      }))
    } else if (fieldName === "dniPhoto") {
      setFiles(prev => ({
        ...prev,
        dniPhoto: selectedFiles[0] || null,
      }))
    } else if (fieldName === "presentationVideo") {
      setFiles(prev => ({
        ...prev,
        presentationVideo: selectedFiles[0] || null,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar con Zod
    const result = castingFormSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(fieldErrors)
      toast.error("Por favor, corrige los errores del formulario")
      return
    }
    setErrors({})

    setIsSubmitting(true)
    setIsUploading(true)

    try {
      // Subir archivos
      let dniPhotoUrl: string | null = null
      let generalPhotoUrls: string[] = []
      let videoUrl: string | null = null

      // Subir DNI
      if (files.dniPhoto) {
        toast.info("Subiendo foto del DNI...")
        dniPhotoUrl = await uploadFile(files.dniPhoto, "casting")
      }

      // Subir fotos generales
      if (files.generalPhotos.length > 0) {
        toast.info("Subiendo fotos generales...")
        for (const photo of files.generalPhotos) {
          const url = await uploadFile(photo, "casting")
          if (url) generalPhotoUrls.push(url)
        }
      }

      // Subir video
      if (files.presentationVideo) {
        toast.info("Subiendo video de presentación...")
        videoUrl = await uploadFile(files.presentationVideo, "casting")
      }

      setIsUploading(false)

      // Enviar datos a la API
      toast.info("Guardando solicitud...")
      const response = await fetch("/api/casting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          birthDate: formData.birthDate,
          gender: formData.gender || null,
          height: formData.height || null,
          weight: formData.weight || null,
          bust: formData.bust || null,
          waist: formData.waist || null,
          hips: formData.hips || null,
          hairColor: formData.hairColor || null,
          eyeColor: formData.eyeColor || null,
          skinTone: formData.skinTone || null,
          tattoos: formData.tattoos || null,
          experience: formData.experience || null,
          additionalInfo: formData.additionalInfo || null,
          instagram: formData.socialMedia || null,
          twitter: formData.socialMedia2 || null,
          dniPhotoUrl,
          generalPhotos: generalPhotoUrls,
          videoUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al enviar la solicitud")
      }

      setIsSubmitted(true)
      toast.success("Solicitud enviada correctamente")
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Error al enviar la solicitud")
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-black text-white pt-8 pb-16">
        <div className="px-4 md:px-8 max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">¡Solicitud Enviada!</h1>
            <p className="text-gray-400 text-lg mb-8">
              Hemos recibido tu solicitud de casting. Nuestro equipo la revisará y te contactaremos pronto.
            </p>
          </div>
          <div className="bg-[rgba(55,65,81,0.42)] rounded-lg p-6 mb-8">
            <h2 className="font-semibold mb-4">¿Qué sigue?</h2>
            <ul className="text-left space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#06B6D4] flex items-center justify-center text-white text-sm flex-shrink-0">
                  1
                </div>
                <span className="text-gray-300">Revisaremos tu perfil y portfolio en los próximos días.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#06B6D4] flex items-center justify-center text-white text-sm flex-shrink-0">
                  2
                </div>
                <span className="text-gray-300">Si tu perfil es seleccionado, te contactaremos por email.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#06B6D4] flex items-center justify-center text-white text-sm flex-shrink-0">
                  3
                </div>
                <span className="text-gray-300">Coordinaremos una audición presencial o virtual.</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => router.push("/")}
            className="btn-primary"
          >
            Volver al Inicio
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white pt-8 pb-16">
      <div className="px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-1">
          <div className="sticky top-24 border border-[#E5E7EB] rounded-lg p-6 shadow-[0_4px_6px_0_rgba(0,0,0,0.1),0_10px_15px_0_rgba(0,0,0,0.1)]">
            <h2 className="font-['Montserrat'] text-2xl font-bold mb-6">Información del Casting</h2>
            <div className="mb-6 border-l-4 border-[#06B6D4] pl-4">
              <h3 className="font-['Montserrat'] text-base font-semibold mb-4 leading-6">Requisitos Generales</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#FA4860] flex-shrink-0 mt-0.5" />
                  <span className="font-['Montserrat'] text-sm font-normal">Edad: 18-35 años</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#FA4860] flex-shrink-0 mt-0.5" />
                  <span className="font-['Montserrat'] text-sm font-normal">Experiencia previa deseable</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#FA4860] flex-shrink-0 mt-0.5" />
                  <span className="font-['Montserrat'] text-sm font-normal">Disponibilidad completa</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#FA4860] flex-shrink-0 mt-0.5" />
                  <span className="font-['Montserrat'] text-sm font-normal">Portfolio actualizado</span>
                </li>
              </ul>
            </div>
            <div className="mb-6 border-l-4 border-[#06B6D4] pl-4">
              <h3 className="font-['Montserrat'] text-base font-semibold mb-4 leading-6">Proceso de Selección</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#06B6D4] flex items-center justify-center text-white font-['Montserrat'] font-semibold flex-shrink-0">
                    1
                  </div>
                  <span className="font-['Montserrat'] text-sm">Aplicación online</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#06B6D4] flex items-center justify-center text-white font-['Montserrat'] font-semibold flex-shrink-0">
                    2
                  </div>
                  <span className="font-['Montserrat'] text-sm">Revisión de portfolio</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#06B6D4] flex items-center justify-center text-white font-['Montserrat'] font-semibold flex-shrink-0">
                    3
                  </div>
                  <span className="font-['Montserrat'] text-sm">Audición presencial</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#06B6D4] flex items-center justify-center text-white font-['Montserrat'] font-semibold flex-shrink-0">
                    4
                  </div>
                  <span className="font-['Montserrat'] text-sm">Selección final</span>
                </li>
              </ul>
            </div>
            <div className="bg-[rgba(250,72,96,0.22)] border-0 border-[#E5E7EB] rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#FA4860]" />
                <h3 className="text-[#FA4860] font-['Montserrat'] text-base font-semibold leading-normal">
                  Fechas Importantes
                </h3>
              </div>
              <div className="space-y-2">
                <p className="font-['Montserrat'] text-sm leading-5">
                  <span className="font-bold">Cierre aplicaciones:</span>{" "}
                  <span className="font-normal">30 de Enero</span>
                </p>
                <p className="font-['Montserrat'] text-sm leading-5">
                  <span className="font-bold">Audiciones:</span> <span className="font-normal">5-10 de Febrero</span>
                </p>
                <p className="font-['Montserrat'] text-sm leading-5">
                  <span className="font-bold">Resultados:</span> <span className="font-normal">15 de Febrero</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <h2 className="font-['Montserrat'] text-lg font-semibold leading-7">Información Personal</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Nombre Completo *</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Nombre Completo"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full ${errors.fullName ? "border border-red-500" : ""}`}
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className={`bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] w-full ${errors.birthDate ? "border border-red-500" : ""}`}
                  />
                  {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Email *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full ${errors.email ? "border border-red-500" : ""}`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Teléfono *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Teléfono"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full"
                  />
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h2 className="font-['Montserrat'] text-lg font-semibold leading-7">Características Físicas</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Género</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] appearance-none cursor-pointer w-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='17' height='10' viewBox='0 0 17 10' fill='none'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M0.367246 0.361771C0.59646 0.141242 0.903851 0.0207377 1.22187 0.0267381C1.53989 0.0327384 1.84251 0.164753 2.06325 0.393771L7.99925 6.69457L13.9352 0.393771C14.0431 0.274819 14.1738 0.178736 14.3195 0.111215C14.4653 0.0436931 14.623 0.00610759 14.7835 0.000684438C14.944 -0.00473872 15.104 0.0221106 15.2539 0.0796426C15.4039 0.137175 15.5408 0.224218 15.6564 0.335616C15.7721 0.447013 15.8643 0.580497 15.9274 0.728159C15.9906 0.875821 16.0234 1.03466 16.0241 1.19525C16.0247 1.35585 15.9931 1.51494 15.9311 1.6631C15.8691 1.81125 15.778 1.94546 15.6632 2.05777L8.86325 9.25777C8.75131 9.37391 8.6171 9.46629 8.46865 9.52938C8.3202 9.59248 8.16055 9.625 7.99925 9.625C7.83794 9.625 7.67829 9.59248 7.52984 9.52938C7.38139 9.46629 7.24719 9.37391 7.13525 9.25777L0.335246 2.05777C0.114718 1.82856 -0.00578654 1.52117 0.000213809 1.20315C0.00621416 0.885129 0.138229 0.582503 0.367246 0.361771Z' fill='white'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                      backgroundSize: "17px 10px",
                    }}
                  >
                    <option value="">Género</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Estatura</label>
                  <select
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] appearance-none cursor-pointer w-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='17' height='10' viewBox='0 0 17 10' fill='none'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M0.367246 0.361771C0.59646 0.141242 0.903851 0.0207377 1.22187 0.0267381C1.53989 0.0327384 1.84251 0.164753 2.06325 0.393771L7.99925 6.69457L13.9352 0.393771C14.0431 0.274819 14.1738 0.178736 14.3195 0.111215C14.4653 0.0436931 14.623 0.00610759 14.7835 0.000684438C14.944 -0.00473872 15.104 0.0221106 15.2539 0.0796426C15.4039 0.137175 15.5408 0.224218 15.6564 0.335616C15.7721 0.447013 15.8643 0.580497 15.9274 0.728159C15.9906 0.875821 16.0234 1.03466 16.0241 1.19525C16.0247 1.35585 15.9931 1.51494 15.9311 1.6631C15.8691 1.81125 15.778 1.94546 15.6632 2.05777L8.86325 9.25777C8.75131 9.37391 8.6171 9.46629 8.46865 9.52938C8.3202 9.59248 8.16055 9.625 7.99925 9.625C7.83794 9.625 7.67829 9.59248 7.52984 9.52938C7.38139 9.46629 7.24719 9.37391 7.13525 9.25777L0.335246 2.05777C0.114718 1.82856 -0.00578654 1.52117 0.000213809 1.20315C0.00621416 0.885129 0.138229 0.582503 0.367246 0.361771Z' fill='white'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                      backgroundSize: "17px 10px",
                    }}
                  >
                    <option value="">Estatura</option>
                    <option value="150-160">150-160 cm</option>
                    <option value="160-170">160-170 cm</option>
                    <option value="170-180">170-180 cm</option>
                    <option value="180+">180+ cm</option>
                  </select>
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Peso</label>
                  <input
                    type="text"
                    name="weight"
                    placeholder="Peso"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Busto</label>
                  <input
                    type="text"
                    name="bust"
                    placeholder="Busto"
                    value={formData.bust}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full"
                  />
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Cintura</label>
                  <input
                    type="text"
                    name="waist"
                    placeholder="Cintura"
                    value={formData.waist}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full"
                  />
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Cadera</label>
                  <input
                    type="text"
                    name="hips"
                    placeholder="Cadera"
                    value={formData.hips}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full"
                  />
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h2 className="font-['Montserrat'] text-lg font-semibold leading-7">Apariencia</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Color de Cabello</label>
                  <select
                    name="hairColor"
                    value={formData.hairColor}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] appearance-none cursor-pointer w-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='17' height='10' viewBox='0 0 17 10' fill='none'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M0.367246 0.361771C0.59646 0.141242 0.903851 0.0207377 1.22187 0.0267381C1.53989 0.0327384 1.84251 0.164753 2.06325 0.393771L7.99925 6.69457L13.9352 0.393771C14.0431 0.274819 14.1738 0.178736 14.3195 0.111215C14.4653 0.0436931 14.623 0.00610759 14.7835 0.000684438C14.944 -0.00473872 15.104 0.0221106 15.2539 0.0796426C15.4039 0.137175 15.5408 0.224218 15.6564 0.335616C15.7721 0.447013 15.8643 0.580497 15.9274 0.728159C15.9906 0.875821 16.0234 1.03466 16.0241 1.19525C16.0247 1.35585 15.9931 1.51494 15.9311 1.6631C15.8691 1.81125 15.778 1.94546 15.6632 2.05777L8.86325 9.25777C8.75131 9.37391 8.6171 9.46629 8.46865 9.52938C8.3202 9.59248 8.16055 9.625 7.99925 9.625C7.83794 9.625 7.67829 9.59248 7.52984 9.52938C7.38139 9.46629 7.24719 9.37391 7.13525 9.25777L0.335246 2.05777C0.114718 1.82856 -0.00578654 1.52117 0.000213809 1.20315C0.00621416 0.885129 0.138229 0.582503 0.367246 0.361771Z' fill='white'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                      backgroundSize: "17px 10px",
                    }}
                  >
                    <option value="">Negro</option>
                    <option value="Negro">Negro</option>
                    <option value="Castaño">Castaño</option>
                    <option value="Rubio">Rubio</option>
                    <option value="Rojo">Rojo</option>
                  </select>
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Color de Ojos</label>
                  <select
                    name="eyeColor"
                    value={formData.eyeColor}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] appearance-none cursor-pointer w-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='17' height='10' viewBox='0 0 17 10' fill='none'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M0.367246 0.361771C0.59646 0.141242 0.903851 0.0207377 1.22187 0.0267381C1.53989 0.0327384 1.84251 0.164753 2.06325 0.393771L7.99925 6.69457L13.9352 0.393771C14.0431 0.274819 14.1738 0.178736 14.3195 0.111215C14.4653 0.0436931 14.623 0.00610759 14.7835 0.000684438C14.944 -0.00473872 15.104 0.0221106 15.2539 0.0796426C15.4039 0.137175 15.5408 0.224218 15.6564 0.335616C15.7721 0.447013 15.8643 0.580497 15.9274 0.728159C15.9906 0.875821 16.0234 1.03466 16.0241 1.19525C16.0247 1.35585 15.9931 1.51494 15.9311 1.6631C15.8691 1.81125 15.778 1.94546 15.6632 2.05777L8.86325 9.25777C8.75131 9.37391 8.6171 9.46629 8.46865 9.52938C8.3202 9.59248 8.16055 9.625 7.99925 9.625C7.83794 9.625 7.67829 9.59248 7.52984 9.52938C7.38139 9.46629 7.24719 9.37391 7.13525 9.25777L0.335246 2.05777C0.114718 1.82856 -0.00578654 1.52117 0.000213809 1.20315C0.00621416 0.885129 0.138229 0.582503 0.367246 0.361771Z' fill='white'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                      backgroundSize: "17px 10px",
                    }}
                  >
                    <option value="">Color de Ojos</option>
                    <option value="Negro">Negro</option>
                    <option value="Marrón">Marrón</option>
                    <option value="Verde">Verde</option>
                    <option value="Azul">Azul</option>
                  </select>
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Tono de Piel</label>
                  <select
                    name="skinTone"
                    value={formData.skinTone}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] appearance-none cursor-pointer w-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='17' height='10' viewBox='0 0 17 10' fill='none'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M0.367246 0.361771C0.59646 0.141242 0.903851 0.0207377 1.22187 0.0267381C1.53989 0.0327384 1.84251 0.164753 2.06325 0.393771L7.99925 6.69457L13.9352 0.393771C14.0431 0.274819 14.1738 0.178736 14.3195 0.111215C14.4653 0.0436931 14.623 0.00610759 14.7835 0.000684438C14.944 -0.00473872 15.104 0.0221106 15.2539 0.0796426C15.4039 0.137175 15.5408 0.224218 15.6564 0.335616C15.7721 0.447013 15.8643 0.580497 15.9274 0.728159C15.9906 0.875821 16.0234 1.03466 16.0241 1.19525C16.0247 1.35585 15.9931 1.51494 15.9311 1.6631C15.8691 1.81125 15.778 1.94546 15.6632 2.05777L8.86325 9.25777C8.75131 9.37391 8.6171 9.46629 8.46865 9.52938C8.3202 9.59248 8.16055 9.625 7.99925 9.625C7.83794 9.625 7.67829 9.59248 7.52984 9.52938C7.38139 9.46629 7.24719 9.37391 7.13525 9.25777L0.335246 2.05777C0.114718 1.82856 -0.00578654 1.52117 0.000213809 1.20315C0.00621416 0.885129 0.138229 0.582503 0.367246 0.361771Z' fill='white'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                      backgroundSize: "17px 10px",
                    }}
                  >
                    <option value="">Tono de Piel</option>
                    <option value="Claro">Claro</option>
                    <option value="Medio">Medio</option>
                    <option value="Oscuro">Oscuro</option>
                  </select>
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Tatuajes</label>
                  <input
                    type="text"
                    name="tattoos"
                    placeholder="Tatuajes"
                    value={formData.tattoos}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full"
                  />
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h2 className="font-['Montserrat'] text-lg font-semibold leading-7">Experiencia</h2>
              </div>
              <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Nivel de Experiencia</label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] w-full appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='17' height='10' viewBox='0 0 17 10' fill='none'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M0.367246 0.361771C0.59646 0.141242 0.903851 0.0207377 1.22187 0.0267381C1.53989 0.0327384 1.84251 0.164753 2.06325 0.393771L7.99925 6.69457L13.9352 0.393771C14.0431 0.274819 14.1738 0.178736 14.3195 0.111215C14.4653 0.0436931 14.623 0.00610759 14.7835 0.000684438C14.944 -0.00473872 15.104 0.0221106 15.2539 0.0796426C15.4039 0.137175 15.5408 0.224218 15.6564 0.335616C15.7721 0.447013 15.8643 0.580497 15.9274 0.728159C15.9906 0.875821 16.0234 1.03466 16.0241 1.19525C16.0247 1.35585 15.9931 1.51494 15.9311 1.6631C15.8691 1.81125 15.778 1.94546 15.6632 2.05777L8.86325 9.25777C8.75131 9.37391 8.6171 9.46629 8.46865 9.52938C8.3202 9.59248 8.16055 9.625 7.99925 9.625C7.83794 9.625 7.67829 9.59248 7.52984 9.52938C7.38139 9.46629 7.24719 9.37391 7.13525 9.25777L0.335246 2.05777C0.114718 1.82856 -0.00578654 1.52117 0.000213809 1.20315C0.00621416 0.885129 0.138229 0.582503 0.367246 0.361771Z' fill='white'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  backgroundSize: "17px 10px",
                }}
              >
                <option value="">Sin experiencia</option>
                <option value="1-2">1-2 años</option>
                <option value="3-5">3-5 años</option>
                <option value="5+">Más de 5 años</option>
              </select>
            </div>
            <div className="mb-8">
              <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Información Adicional</label>
              <textarea
                name="additionalInfo"
                placeholder="Información adicional"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                rows={6}
                className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] w-full placeholder:text-lg placeholder:font-normal resize-none"
              />
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <h2 className="font-['Montserrat'] text-lg font-semibold leading-7">Redes Sociales</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Instagram</label>
                  <input
                    type="url"
                    name="socialMedia"
                    placeholder="Link a Instagram"
                    value={formData.socialMedia}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] w-full placeholder:text-lg placeholder:font-normal"
                  />
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Twitter</label>
                  <input
                    type="url"
                    name="socialMedia2"
                    placeholder="Link a Twitter"
                    value={formData.socialMedia2}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] rounded-lg font-['Montserrat'] w-full placeholder:text-lg placeholder:font-normal"
                  />
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h2 className="font-['Montserrat'] text-lg font-semibold leading-7">Fotografías</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] rounded-lg p-6 bg-transparent min-h-[180px]">
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-white text-center font-['Montserrat'] text-base font-normal leading-6 mb-4">
                    Foto del DNI
                  </p>
                  <input
                    id="dniPhoto"
                    type="file"
                    name="dniPhoto"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "dniPhoto")}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("dniPhoto")?.click()}
                    className="bg-[#06B6D4] text-white px-6 py-2 rounded font-['Montserrat'] text-sm"
                  >
                    Seleccionar Archivos
                  </button>
                  {files.dniPhoto && (
                    <p className="text-green-400 text-xs mt-2">{files.dniPhoto.name}</p>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] rounded-lg p-6 bg-transparent min-h-[180px]">
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-white text-center font-['Montserrat'] text-base font-normal leading-6 mb-4">
                    Fotos en general
                  </p>
                  <input
                    id="generalPhotos"
                    type="file"
                    name="generalPhotos"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, "generalPhotos")}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("generalPhotos")?.click()}
                    className="bg-[#06B6D4] text-white px-6 py-2 rounded font-['Montserrat'] text-sm"
                  >
                    Seleccionar Archivos
                  </button>
                  {files.generalPhotos.length > 0 && (
                    <p className="text-green-400 text-xs mt-2">{files.generalPhotos.length} archivo(s) seleccionado(s)</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-8 flex justify-center">
              <img src="/images/imagen-corporal.png" alt="Referencia corporal" className="w-[30%] h-auto" />
            </div>
            <div className="mb-8">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] rounded-lg p-8 bg-transparent min-h-[200px]">
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-white text-center font-['Montserrat'] text-base font-normal leading-6 mb-4">
                  Video de presentación
                </p>
                <input
                  id="presentationVideo"
                  type="file"
                  name="presentationVideo"
                  accept="video/mp4,video/*"
                  onChange={(e) => handleFileChange(e, "presentationVideo")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("presentationVideo")?.click()}
                  className="bg-[#06B6D4] text-white px-6 py-2 rounded font-['Montserrat'] text-sm mb-2"
                >
                  Seleccionar Video
                </button>
                <p className="text-gray-400 text-xs text-center font-['Montserrat']">Máximo 2 min, Formatos: MP4</p>
                <p className="text-gray-400 text-xs text-center font-['Montserrat']">
                  Se recomienda presentarte claramente
                </p>
                {files.presentationVideo && (
                  <p className="text-green-400 text-xs mt-2">{files.presentationVideo.name}</p>
                )}
              </div>
            </div>
            <div className="flex justify-start">
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting || isUploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isUploading ? "Subiendo archivos..." : "Enviando..."}
                  </>
                ) : (
                  "Enviar Solicitud"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
