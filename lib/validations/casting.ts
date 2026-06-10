import { z } from "zod"

// Función para calcular edad
const calculateAge = (birthDate: Date): number => {
  const today = new Date()
  return Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

// Schema para el formulario del frontend
export const castingFormSchema = z.object({
  // Campos requeridos
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  birthDate: z.string().refine((date) => {
    if (!date) return false
    const birth = new Date(date)
    return !isNaN(birth.getTime()) && calculateAge(birth) >= 18
  }, "You must be at least 18 years old"),

  // Campos opcionales
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  gender: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  bust: z.string().optional(),
  waist: z.string().optional(),
  hips: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  skinTone: z.string().optional(),
  tattoos: z.string().optional(),
  experience: z.string().optional(),
  additionalInfo: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
})

export type CastingFormData = z.infer<typeof castingFormSchema>

// Schema para la API (con campos adicionales de archivos)
export const castingApiSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  birthDate: z.string().refine((date) => {
    if (!date) return false
    const birth = new Date(date)
    return !isNaN(birth.getTime()) && calculateAge(birth) >= 18
  }, "You must be at least 18 years old"),
  phone: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  height: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  bust: z.string().nullable().optional(),
  waist: z.string().nullable().optional(),
  hips: z.string().nullable().optional(),
  hairColor: z.string().nullable().optional(),
  eyeColor: z.string().nullable().optional(),
  skinTone: z.string().nullable().optional(),
  tattoos: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  additionalInfo: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  twitter: z.string().nullable().optional(),
  dniPhotoUrl: z.string().nullable().optional(),
  dniBackUrl: z.string().nullable().optional(),
  generalPhotos: z.array(z.string()).optional(),
  videoUrl: z.string().nullable().optional(),
  identityVerified: z.boolean().optional(),
  identitySimilarity: z.number().nullable().optional(),
})

export type CastingApiData = z.infer<typeof castingApiSchema>
