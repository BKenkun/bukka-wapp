"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Clock } from "@/components/icons"
import { toast } from "sonner"
import { castingFormSchema } from "@/lib/validations/casting"

const STEPS = [
  { id: 1, label: "DNI" },
  { id: 2, label: "Photos & Video" },
  { id: 3, label: "Personal Info" },
  { id: 4, label: "Physical" },
  { id: 5, label: "Final" },
]

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='17' height='10' viewBox='0 0 17 10' fill='none'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M0.367246 0.361771C0.59646 0.141242 0.903851 0.0207377 1.22187 0.0267381C1.53989 0.0327384 1.84251 0.164753 2.06325 0.393771L7.99925 6.69457L13.9352 0.393771C14.0431 0.274819 14.1738 0.178736 14.3195 0.111215C14.4653 0.0436931 14.623 0.00610759 14.7835 0.000684438C14.944 -0.00473872 15.104 0.0221106 15.2539 0.0796426C15.4039 0.137175 15.5408 0.224218 15.6564 0.335616C15.7721 0.447013 15.8643 0.580497 15.9274 0.728159C15.9906 0.875821 16.0234 1.03466 16.0241 1.19525C16.0247 1.35585 15.9931 1.51494 15.9311 1.6631C15.8691 1.81125 15.778 1.94546 15.6632 2.05777L8.86325 9.25777C8.75131 9.37391 8.6171 9.46629 8.46865 9.52938C8.3202 9.59248 8.16055 9.625 7.99925 9.625C7.83794 9.625 7.67829 9.59248 7.52984 9.52938C7.38139 9.46629 7.24719 9.37391 7.13525 9.25777L0.335246 2.05777C0.114718 1.82856 -0.00578654 1.52117 0.000213809 1.20315C0.00621416 0.885129 0.138229 0.582503 0.367246 0.361771Z' fill='white'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
  backgroundSize: "17px 10px",
}

export default function CastingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationPassed, setVerificationPassed] = useState(false)
  const [verificationSimilarity, setVerificationSimilarity] = useState<number | null>(null)

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
    dniFront: File | null
    dniBack: File | null
    generalPhotos: File[]
    presentationVideo: File | null
  }>({
    dniFront: null,
    dniBack: null,
    generalPhotos: [],
    presentationVideo: null,
  })

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", folder)
    const response = await fetch("/api/upload", { method: "POST", body: fd })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Error uploading file")
    }
    const result = await response.json()
    return result.url
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return
    if (fieldName === "generalPhotos") {
      setFiles(prev => ({ ...prev, generalPhotos: Array.from(selectedFiles) }))
    } else if (fieldName === "dniFront") {
      setFiles(prev => ({ ...prev, dniFront: selectedFiles[0] || null }))
    } else if (fieldName === "dniBack") {
      setFiles(prev => ({ ...prev, dniBack: selectedFiles[0] || null }))
    } else if (fieldName === "presentationVideo") {
      setFiles(prev => ({ ...prev, presentationVideo: selectedFiles[0] || null }))
    }
  }

  const handleVerification = async () => {
    if (files.generalPhotos.length === 0) {
      toast.error("Upload at least one general photo for verification")
      return
    }

    setIsVerifying(true)
    try {
      const fd = new FormData()
      fd.append("dniPhoto", files.dniFront!)
      fd.append("selfiePhoto", files.generalPhotos[0])

      const res = await fetch("/api/casting/verify", { method: "POST", body: fd })
      const data = await res.json()

      if (data.serviceError) {
        // Service error (network, AWS down) — let them retry without clearing files
        toast.error(data.error || "Verification service error. Please try again.")
        return
      }

      if (data.verified) {
        setVerificationPassed(true)
        setVerificationSimilarity(data.similarity)
        toast.success("Identity verified successfully")
        setCurrentStep(3)
      } else {
        // Verification failed — clear all files, go back to step 1
        setFiles({ dniFront: null, dniBack: null, generalPhotos: [], presentationVideo: null })
        setVerificationPassed(false)
        setVerificationSimilarity(null)
        setCurrentStep(1)

        // Reset file inputs
        const inputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>
        inputs.forEach(input => { input.value = "" })

        toast.error(
          data.error ||
          "We could not verify your identity. The photos have been deleted. Please try again with clearer photos.",
          { duration: 8000 }
        )
      }
    } catch {
      toast.error("Verification error. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const goNext = () => {
    if (currentStep === 1) {
      if (!files.dniFront || !files.dniBack) {
        toast.error("Upload both sides of your ID to continue")
        return
      }
    }

    if (currentStep === 2) {
      handleVerification()
      return
    }

    if (currentStep === 3) {
      const stepErrors: Record<string, string> = {}
      if (!formData.fullName.trim()) stepErrors.fullName = "Required"
      if (!formData.email.trim()) stepErrors.email = "Required"
      if (!formData.birthDate) stepErrors.birthDate = "Required"
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors)
        return
      }
    }

    setErrors({})
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
  }

  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const handleSubmit = async () => {
    const result = castingFormSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message
      })
      setErrors(fieldErrors)
      toast.error("Please fix the form errors")
      if (fieldErrors.fullName || fieldErrors.email || fieldErrors.birthDate || fieldErrors.phone) {
        setCurrentStep(3)
      }
      return
    }
    setErrors({})
    setIsSubmitting(true)
    setIsUploading(true)

    try {
      let dniPhotoUrl: string | null = null
      let dniBackUrl: string | null = null
      let generalPhotoUrls: string[] = []
      let videoUrl: string | null = null

      if (files.dniFront) {
        toast.info("Uploading DNI (front)...")
        dniPhotoUrl = await uploadFile(files.dniFront, "casting")
      }
      if (files.dniBack) {
        toast.info("Uploading DNI (back)...")
        dniBackUrl = await uploadFile(files.dniBack, "casting")
      }
      if (files.generalPhotos.length > 0) {
        toast.info("Uploading photos...")
        for (const photo of files.generalPhotos) {
          const url = await uploadFile(photo, "casting")
          if (url) generalPhotoUrls.push(url)
        }
      }
      if (files.presentationVideo) {
        toast.info("Uploading video...")
        videoUrl = await uploadFile(files.presentationVideo, "casting-video")
      }
      setIsUploading(false)

      toast.info("Saving application...")
      const response = await fetch("/api/casting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          dniBackUrl,
          generalPhotos: generalPhotoUrls,
          videoUrl,
          identityVerified: verificationPassed,
          identitySimilarity: verificationSimilarity,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error submitting application")
      }

      setIsSubmitted(true)
      toast.success("Application submitted successfully")
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Error submitting application")
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
            <div className="w-20 h-20 bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
            <p className="text-gray-400 text-lg mb-8">
              We have received your casting application. Our team will review it and contact you soon.
            </p>
          </div>
          <div className="bg-[rgba(55,65,81,0.42)] p-6 mb-8">
            <h2 className="font-semibold mb-4">What&apos;s next?</h2>
            <ul className="text-left space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#06B6D4] flex items-center justify-center text-white text-sm flex-shrink-0">1</div>
                <span className="text-gray-300">We will review your profile and portfolio in the coming days.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#06B6D4] flex items-center justify-center text-white text-sm flex-shrink-0">2</div>
                <span className="text-gray-300">If your profile is selected, we will contact you by email.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#06B6D4] flex items-center justify-center text-white text-sm flex-shrink-0">3</div>
                <span className="text-gray-300">We will schedule an in-person or virtual audition.</span>
              </li>
            </ul>
          </div>
          <button onClick={() => router.push("/")} className="btn-primary">
            Back to Home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white pt-8 pb-16">
      {/* Verification overlay */}
      {isVerifying && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[rgba(55,65,81,0.95)] p-8 max-w-sm mx-4 text-center shadow-2xl border border-[#06B6D4]/30">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <svg className="animate-spin w-20 h-20 text-[#06B6D4]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#06B6D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2 font-['Montserrat']">Verifying identity</h3>
            <p className="text-gray-400 text-sm font-['Montserrat']">
              We are comparing your ID photo with your personal photo. This will only take a few seconds...
            </p>
          </div>
        </div>
      )}

      <div className="px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 border border-[#E5E7EB] p-6 shadow-[0_4px_6px_0_rgba(0,0,0,0.1),0_10px_15px_0_rgba(0,0,0,0.1)]">
            <h2 className="font-['Montserrat'] text-2xl font-bold mb-6">Casting Information</h2>
            <div className="mb-6 border-l-4 border-[#06B6D4] pl-4">
              <h3 className="font-['Montserrat'] text-base font-semibold mb-4 leading-6">General Requirements</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#FA4860] flex-shrink-0 mt-0.5" />
                  <span className="font-['Montserrat'] text-sm font-normal">Age: 18-35 years</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#FA4860] flex-shrink-0 mt-0.5" />
                  <span className="font-['Montserrat'] text-sm font-normal">Previous experience desirable</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#FA4860] flex-shrink-0 mt-0.5" />
                  <span className="font-['Montserrat'] text-sm font-normal">Full availability</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#FA4860] flex-shrink-0 mt-0.5" />
                  <span className="font-['Montserrat'] text-sm font-normal">Updated portfolio</span>
                </li>
              </ul>
            </div>
            <div className="mb-6 border-l-4 border-[#06B6D4] pl-4">
              <h3 className="font-['Montserrat'] text-base font-semibold mb-4 leading-6">Selection Process</h3>
              <ul className="space-y-3">
                {["Online application", "Portfolio review", "In-person audition", "Final selection"].map((step, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#06B6D4] flex items-center justify-center text-white font-['Montserrat'] font-semibold flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="font-['Montserrat'] text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[rgba(250,72,96,0.22)] border-0 border-[#E5E7EB] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#FA4860]" />
                <h3 className="text-[#FA4860] font-['Montserrat'] text-base font-semibold leading-normal">Important Dates</h3>
              </div>
              <div className="space-y-2">
                <p className="font-['Montserrat'] text-sm leading-5">
                  <span className="font-bold">Applications close:</span> <span className="font-normal">January 30</span>
                </p>
                <p className="font-['Montserrat'] text-sm leading-5">
                  <span className="font-bold">Auditions:</span> <span className="font-normal">February 5-10</span>
                </p>
                <p className="font-['Montserrat'] text-sm leading-5">
                  <span className="font-bold">Results:</span> <span className="font-normal">February 15</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main form area */}
        <div className="lg:col-span-2">
          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step) => (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 flex items-center justify-center text-sm font-bold transition-colors ${
                      step.id < currentStep
                        ? "bg-green-500 text-white"
                        : step.id === currentStep
                        ? "bg-[#06B6D4] text-white"
                        : "bg-[rgba(55,65,81,0.42)] text-gray-400"
                    }`}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`text-xs mt-1.5 font-['Montserrat'] text-center ${
                    step.id === currentStep ? "text-[#06B6D4] font-semibold" : "text-gray-500"
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-[rgba(55,65,81,0.42)] mt-3">
              <div
                className="h-full bg-[#06B6D4] transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* ─── STEP 1: DNI (Front + Back) ─── */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-['Montserrat'] text-2xl font-bold mb-2">ID Verification</h2>
                <p className="text-gray-400 font-['Montserrat'] text-sm">
                  Upload clear photos of both sides of your ID (DNI/Passport). This is required to verify your identity and age.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DNI Front */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] p-8 bg-transparent min-h-[250px]">
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-white text-center font-['Montserrat'] text-base font-medium mb-1">
                    DNI - Front
                  </p>
                  <p className="text-gray-400 text-center font-['Montserrat'] text-xs mb-4">
                    Side with your photo
                  </p>
                  <input
                    id="dniFront"
                    type="file"
                    name="dniFront"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "dniFront")}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("dniFront")?.click()}
                    className="bg-[#06B6D4] text-white px-6 py-2.5 font-['Montserrat'] text-sm font-medium"
                  >
                    Select File
                  </button>
                  {files.dniFront && (
                    <div className="mt-3 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <p className="text-green-400 text-xs truncate max-w-[180px]">{files.dniFront.name}</p>
                    </div>
                  )}
                </div>

                {/* DNI Back */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] p-8 bg-transparent min-h-[250px]">
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-white text-center font-['Montserrat'] text-base font-medium mb-1">
                    DNI - Back
                  </p>
                  <p className="text-gray-400 text-center font-['Montserrat'] text-xs mb-4">
                    Reverse side of your ID
                  </p>
                  <input
                    id="dniBack"
                    type="file"
                    name="dniBack"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "dniBack")}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("dniBack")?.click()}
                    className="bg-[#06B6D4] text-white px-6 py-2.5 font-['Montserrat'] text-sm font-medium"
                  >
                    Select File
                  </button>
                  {files.dniBack && (
                    <div className="mt-3 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <p className="text-green-400 text-xs truncate max-w-[180px]">{files.dniBack.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info note about verification */}
              <div className="flex items-start gap-3 bg-[rgba(6,182,212,0.1)] border border-[#06B6D4]/30 p-4">
                <svg className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-[#06B6D4] font-['Montserrat'] text-sm font-semibold mb-1">Identity Verification</p>
                  <p className="text-gray-400 font-['Montserrat'] text-xs">
                    After uploading your photos in the next step, we will automatically verify that your face matches your ID.
                    Your images are processed securely and are not stored during verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Photos & Video ─── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-['Montserrat'] text-2xl font-bold mb-2">Photos & Video</h2>
                <p className="text-gray-400 font-['Montserrat'] text-sm">
                  Upload your general photos and a short presentation video. Your first photo will be used for identity verification.
                </p>
              </div>

              {/* General photos */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] p-8 bg-transparent min-h-[200px]">
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-white text-center font-['Montserrat'] text-base font-medium mb-1">General Photos</p>
                <p className="text-gray-400 text-center font-['Montserrat'] text-xs mb-4">
                  The first photo must clearly show your face (used for verification)
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
                  className="bg-[#06B6D4] text-white px-6 py-2 font-['Montserrat'] text-sm"
                >
                  Select Files
                </button>
                {files.generalPhotos.length > 0 && (
                  <p className="text-green-400 text-xs mt-2">{files.generalPhotos.length} file(s) selected</p>
                )}
              </div>

              {/* Body reference image */}
              <div className="flex justify-center">
                <img src="/images/imagen-corporal.png" alt="Body reference" className="w-[30%] h-auto" />
              </div>

              {/* Presentation video */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] p-8 bg-transparent min-h-[200px]">
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-white text-center font-['Montserrat'] text-base font-medium mb-4">Presentation Video</p>
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
                  className="bg-[#06B6D4] text-white px-6 py-2 font-['Montserrat'] text-sm mb-2"
                >
                  Select Video
                </button>
                <p className="text-gray-400 text-xs text-center font-['Montserrat']">Max 2 min, Format: MP4</p>
                <p className="text-gray-400 text-xs text-center font-['Montserrat']">
                  We recommend introducing yourself clearly
                </p>
                {files.presentationVideo && (
                  <div className="mt-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <p className="text-green-400 text-xs">{files.presentationVideo.name}</p>
                  </div>
                )}
              </div>

              {/* Verification notice */}
              <div className="flex items-start gap-3 bg-[rgba(250,176,5,0.1)] border border-yellow-500/30 p-4">
                <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-yellow-500 font-['Montserrat'] text-sm font-semibold mb-1">Automatic Verification</p>
                  <p className="text-gray-400 font-['Montserrat'] text-xs">
                    When you click &quot;Next&quot;, we will verify that your face matches the ID you uploaded.
                    If verification fails, you will need to upload all files again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Personal Info ─── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-['Montserrat'] text-2xl font-bold mb-2">Personal Information</h2>
                <p className="text-gray-400 font-['Montserrat'] text-sm">Fields marked with * are required.</p>
              </div>

              {verificationPassed && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 p-4">
                  <div className="w-8 h-8 bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-green-400 font-['Montserrat'] text-sm font-semibold">Identity Verified</p>
                    <p className="text-gray-400 font-['Montserrat'] text-xs">
                      Your identity has been successfully verified.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full ${errors.fullName ? "border border-red-500" : ""}`}
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Date of Birth *</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className={`bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] w-full ${errors.birthDate ? "border border-red-500" : ""}`}
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
                    className={`bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full ${errors.email ? "border border-red-500" : ""}`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Physical Characteristics & Appearance ─── */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div>
                <h2 className="font-['Montserrat'] text-2xl font-bold mb-2">Physical Characteristics</h2>
                <p className="text-gray-400 font-['Montserrat'] text-sm">All fields are optional.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] appearance-none cursor-pointer w-full" style={selectStyle}>
                    <option value="">Gender</option>
                    <option value="Masculino">Male</option>
                    <option value="Femenino">Female</option>
                    <option value="Otro">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Height</label>
                  <select name="height" value={formData.height} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] appearance-none cursor-pointer w-full" style={selectStyle}>
                    <option value="">Height</option>
                    <option value="150-160">150-160 cm</option>
                    <option value="160-170">160-170 cm</option>
                    <option value="170-180">170-180 cm</option>
                    <option value="180+">180+ cm</option>
                  </select>
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Weight</label>
                  <input type="text" name="weight" placeholder="Weight" value={formData.weight} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Bust</label>
                  <input type="text" name="bust" placeholder="Bust" value={formData.bust} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full" />
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Waist</label>
                  <input type="text" name="waist" placeholder="Waist" value={formData.waist} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full" />
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Hips</label>
                  <input type="text" name="hips" placeholder="Hips" value={formData.hips} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full" />
                </div>
              </div>

              <h3 className="font-['Montserrat'] text-lg font-semibold">Appearance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Hair Color</label>
                  <select name="hairColor" value={formData.hairColor} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] appearance-none cursor-pointer w-full" style={selectStyle}>
                    <option value="">Hair Color</option>
                    <option value="Negro">Black</option>
                    <option value="Castaño">Brown</option>
                    <option value="Rubio">Blonde</option>
                    <option value="Rojo">Red</option>
                  </select>
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Eye Color</label>
                  <select name="eyeColor" value={formData.eyeColor} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] appearance-none cursor-pointer w-full" style={selectStyle}>
                    <option value="">Eye Color</option>
                    <option value="Negro">Black</option>
                    <option value="Marrón">Brown</option>
                    <option value="Verde">Green</option>
                    <option value="Azul">Blue</option>
                  </select>
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Skin Tone</label>
                  <select name="skinTone" value={formData.skinTone} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] appearance-none cursor-pointer w-full" style={selectStyle}>
                    <option value="">Skin Tone</option>
                    <option value="Claro">Fair</option>
                    <option value="Medio">Medium</option>
                    <option value="Oscuro">Dark</option>
                  </select>
                </div>
                <div>
                  <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Tattoos</label>
                  <input type="text" name="tattoos" placeholder="Describe tattoos if any" value={formData.tattoos} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] placeholder:text-lg placeholder:font-normal w-full" />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 5: Experience, Additional Info & Social Media ─── */}
          {currentStep === 5 && (
            <div className="space-y-8">
              <div>
                <h2 className="font-['Montserrat'] text-2xl font-bold mb-2">Final Details</h2>
                <p className="text-gray-400 font-['Montserrat'] text-sm">Experience, additional info, and social media links.</p>
              </div>

              <div>
                <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Experience Level</label>
                <select name="experience" value={formData.experience} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] w-full appearance-none cursor-pointer" style={selectStyle}>
                  <option value="">No experience</option>
                  <option value="1-2">1-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5+">More than 5 years</option>
                </select>
              </div>

              <div>
                <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Additional Information</label>
                <textarea
                  name="additionalInfo"
                  placeholder="Anything else you'd like us to know..."
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={5}
                  className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] w-full placeholder:text-lg placeholder:font-normal resize-none"
                />
              </div>

              <div>
                <h3 className="font-['Montserrat'] text-lg font-semibold mb-4">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-['Montserrat'] text-sm font-medium mb-2 block">Instagram</label>
                    <input type="url" name="socialMedia" placeholder="Instagram link" value={formData.socialMedia} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] w-full placeholder:text-lg placeholder:font-normal" />
                  </div>
                  <div>
                    <label className="font-['Montserrat'] text-sm font-medium mb-2 block">OnlyFans</label>
                    <input type="url" name="socialMedia2" placeholder="OnlyFans link" value={formData.socialMedia2} onChange={handleInputChange} className="bg-[rgba(55,65,81,0.42)] px-4 py-[13px] font-['Montserrat'] w-full placeholder:text-lg placeholder:font-normal" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-10">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={isVerifying}
                className="btn-secondary px-8 disabled:opacity-50"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                disabled={isVerifying}
                className="btn-primary px-8 disabled:opacity-50 flex items-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Next"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
                className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting || isUploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isUploading ? "Uploading files..." : "Submitting..."}
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
