import { createUploadthing, type FileRouter } from "uploadthing/next"
import { auth } from "@/auth"

const f = createUploadthing()

export const ourFileRouter = {
  // Upload de imágenes generales (perfil, galería, etc.)
  imageUpload: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image uploaded by:", metadata.userId)
      return { url: file.ufsUrl }
    }),

  // Upload de imagen de perfil (single)
  profileImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile image uploaded by:", metadata.userId)
      return { url: file.ufsUrl }
    }),

  // Upload de thumbnails de video (admin)
  videoThumbnail: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      // TODO: Verificar si es admin
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de preview/trailer personalizado (admin)
  videoPreview: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      // TODO: Verificar si es admin
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de galería de video (admin)
  videoGallery: f({ image: { maxFileSize: "4MB", maxFileCount: 20 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      // TODO: Verificar si es admin
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de subtítulos SRT (admin)
  subtitleUpload: f({ "text/plain": { maxFileSize: "1MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      // TODO: Verificar si es admin
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de imágenes de productos (admin)
  productImages: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      // TODO: Verificar si es admin
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de imágenes de performer (admin)
  performerImages: f({ image: { maxFileSize: "4MB", maxFileCount: 20 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      // TODO: Verificar si es admin
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de banners (admin)
  bannerUpload: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      // TODO: Verificar si es admin
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload para casting (público con validación)
  castingDocuments: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      // Casting es público, no requiere auth
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de video para casting (público)
  castingVideo: f({
    video: { maxFileSize: "128MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // Casting es público
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de DNI para casting (público pero sensible)
  castingId: f({
    image: { maxFileSize: "4MB", maxFileCount: 2 },
  })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de imágenes para blog (admin)
  blogImages: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      // TODO: Verificar si es admin
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de categoría imagen (admin)
  categoryImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      // TODO: Verificar si es admin
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Upload de favicon (admin)
  faviconUpload: f({ image: { maxFileSize: "512KB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("No autorizado")
      // TODO: Verificar si es admin
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
