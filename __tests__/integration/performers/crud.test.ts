import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockRequest, getResponseJson } from '../test-utils'
import {
  prisma,
  cleanupDatabase,
  createAdminUser,
  createPerformer,
  createVideo,
  linkVideoToPerformer,
  createProduct,
} from '../helpers'
import { setMockSession, clearMockSession, createAdminSession, createMockSession } from '../../mocks/auth'

// Mock the auth module
vi.mock('@/auth', () => import('../../mocks/auth'))
vi.mock('@/lib/auth', () => import('../../mocks/auth'))

// Import routes after mocking
const { GET: getPerformers, POST: createPerformerRoute } = await import('@/app/api/performers/route')
const { GET: getPerformer, PATCH: updatePerformer, DELETE: deletePerformer } = await import(
  '@/app/api/performers/[slug]/route'
)

describe('Performers API - CRUD Operations', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    clearMockSession()
  })

  describe('GET /api/performers', () => {
    it('should return empty list when no performers exist', async () => {
      const request = createMockRequest('/api/performers')
      const response = await getPerformers(request)
      const data = await getResponseJson<{ performers: unknown[]; pagination: { total: number } }>(response)

      expect(response.status).toBe(200)
      expect(data.performers).toEqual([])
      expect(data.pagination.total).toBe(0)
    })

    it('should return all performers', async () => {
      await createPerformer({ name: 'Performer 1' })
      await createPerformer({ name: 'Performer 2' })

      const request = createMockRequest('/api/performers')
      const response = await getPerformers(request)
      const data = await getResponseJson<{ performers: { name: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.performers).toHaveLength(2)
    })

    it('should paginate results', async () => {
      // Create 15 performers
      for (let i = 0; i < 15; i++) {
        await createPerformer({ name: `Performer ${i}` })
      }

      const request = createMockRequest('/api/performers', {
        searchParams: { page: '1', limit: '10' },
      })
      const response = await getPerformers(request)
      const data = await getResponseJson<{ performers: unknown[]; pagination: { total: number; totalPages: number } }>(
        response
      )

      expect(response.status).toBe(200)
      expect(data.performers).toHaveLength(10)
      expect(data.pagination.total).toBe(15)
      expect(data.pagination.totalPages).toBe(2)
    })

    it('should search by name', async () => {
      await createPerformer({ name: 'Maria Garcia' })
      await createPerformer({ name: 'Ana Lopez' })

      const request = createMockRequest('/api/performers', {
        searchParams: { search: 'Maria' },
      })
      const response = await getPerformers(request)
      const data = await getResponseJson<{ performers: { name: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.performers).toHaveLength(1)
      expect(data.performers[0].name).toBe('Maria Garcia')
    })

    it('should filter by location', async () => {
      await createPerformer({ name: 'Performer 1', location: 'Spain' })
      await createPerformer({ name: 'Performer 2', location: 'France' })

      const request = createMockRequest('/api/performers', {
        searchParams: { location: 'Spain' },
      })
      const response = await getPerformers(request)
      const data = await getResponseJson<{ performers: { name: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.performers).toHaveLength(1)
      expect(data.performers[0].name).toBe('Performer 1')
    })
  })

  describe('GET /api/performers/[slug]', () => {
    it('should return 404 for non-existent performer', async () => {
      const request = createMockRequest('/api/performers/non-existent')
      const response = await getPerformer(request, { params: Promise.resolve({ slug: 'non-existent' }) })
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Performer no encontrada')
    })

    it('should return performer details', async () => {
      await createPerformer({
        name: 'Test Performer',
        slug: 'test-performer',
        location: 'Spain',
        bio: 'A test bio',
      })

      const request = createMockRequest('/api/performers/test-performer')
      const response = await getPerformer(request, { params: Promise.resolve({ slug: 'test-performer' }) })
      const data = await getResponseJson<{
        name: string
        slug: string
        location: string
        bio: string
      }>(response)

      expect(response.status).toBe(200)
      expect(data.name).toBe('Test Performer')
      expect(data.slug).toBe('test-performer')
      expect(data.location).toBe('Spain')
      expect(data.bio).toBe('A test bio')
    })

    it('should include performer videos', async () => {
      const performer = await createPerformer({ slug: 'test-performer' })
      const video1 = await createVideo({ title: 'Video 1', status: 'PUBLISHED' })
      const video2 = await createVideo({ title: 'Video 2', status: 'PUBLISHED' })
      await linkVideoToPerformer(video1.id, performer.id)
      await linkVideoToPerformer(video2.id, performer.id)

      const request = createMockRequest('/api/performers/test-performer')
      const response = await getPerformer(request, { params: Promise.resolve({ slug: 'test-performer' }) })
      const data = await getResponseJson<{
        videos: { items: { title: string }[]; pagination: { total: number } }
      }>(response)

      expect(response.status).toBe(200)
      expect(data.videos.items).toHaveLength(2)
      expect(data.videos.pagination.total).toBe(2)
    })

    it('should include associated products', async () => {
      const performer = await createPerformer({ slug: 'test-performer' })
      await createProduct({ name: 'Product 1', performerId: performer.id, status: 'ACTIVE' })
      await createProduct({ name: 'Product 2', performerId: performer.id, status: 'ACTIVE' })

      const request = createMockRequest('/api/performers/test-performer')
      const response = await getPerformer(request, { params: Promise.resolve({ slug: 'test-performer' }) })
      const data = await getResponseJson<{
        products: { name: string }[]
      }>(response)

      expect(response.status).toBe(200)
      expect(data.products).toHaveLength(2)
    })
  })

  describe('POST /api/performers', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()

      const request = createMockRequest('/api/performers', {
        method: 'POST',
        body: {
          name: 'New Performer',
          slug: 'new-performer',
        },
      })
      const response = await createPerformerRoute(request)
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autorizado')
    })

    it('should return 403 when user is not admin', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com', password: 'test', isAdmin: false },
      })
      setMockSession(createMockSession({ userId: user.id, isAdmin: false }))

      const request = createMockRequest('/api/performers', {
        method: 'POST',
        body: {
          name: 'New Performer',
          slug: 'new-performer',
        },
      })
      const response = await createPerformerRoute(request)
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(403)
      expect(data.error).toBe('No autorizado')
    })

    it('should create performer when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/performers', {
        method: 'POST',
        body: {
          name: 'New Performer',
          slug: 'new-performer',
          nationality: 'Spain',
          bio: 'Test bio',
        },
      })
      const response = await createPerformerRoute(request)
      const data = await getResponseJson<{ name: string; slug: string }>(response)

      expect(response.status).toBe(201)
      expect(data.name).toBe('New Performer')
      expect(data.slug).toBe('new-performer')

      // Verify in database
      const dbPerformer = await prisma.performer.findUnique({ where: { slug: 'new-performer' } })
      expect(dbPerformer).toBeDefined()
    })

    it('should return 400 for duplicate slug', async () => {
      await createPerformer({ slug: 'existing-slug' })
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/performers', {
        method: 'POST',
        body: {
          name: 'New Performer',
          slug: 'existing-slug',
        },
      })
      const response = await createPerformerRoute(request)
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Ya existe una performer con ese slug')
    })
  })

  describe('PATCH /api/performers/[slug]', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()
      await createPerformer({ slug: 'test-performer' })

      const request = createMockRequest('/api/performers/test-performer', {
        method: 'PATCH',
        body: { name: 'Updated Name' },
      })
      const response = await updatePerformer(request, { params: Promise.resolve({ slug: 'test-performer' }) })

      expect(response.status).toBe(401)
    })

    it('should update performer when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      await createPerformer({ slug: 'test-performer', name: 'Original Name' })
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/performers/test-performer', {
        method: 'PATCH',
        body: { name: 'Updated Name', nationality: 'France' },
      })
      const response = await updatePerformer(request, { params: Promise.resolve({ slug: 'test-performer' }) })
      const data = await getResponseJson<{ name: string; nationality: string }>(response)

      expect(response.status).toBe(200)
      expect(data.name).toBe('Updated Name')
    })

    it('should return 404 for non-existent performer', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/performers/non-existent', {
        method: 'PATCH',
        body: { name: 'Updated Name' },
      })
      const response = await updatePerformer(request, { params: Promise.resolve({ slug: 'non-existent' }) })
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Performer no encontrada')
    })

    it('should prevent changing slug to existing one', async () => {
      await createPerformer({ slug: 'existing-slug' })
      await createPerformer({ slug: 'test-performer' })
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/performers/test-performer', {
        method: 'PATCH',
        body: { slug: 'existing-slug' },
      })
      const response = await updatePerformer(request, { params: Promise.resolve({ slug: 'test-performer' }) })
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Ya existe una performer con ese slug')
    })
  })

  describe('DELETE /api/performers/[slug]', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()
      await createPerformer({ slug: 'test-performer' })

      const request = createMockRequest('/api/performers/test-performer', { method: 'DELETE' })
      const response = await deletePerformer(request, { params: Promise.resolve({ slug: 'test-performer' }) })

      expect(response.status).toBe(401)
    })

    it('should delete performer when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      await createPerformer({ slug: 'test-performer' })
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/performers/test-performer', { method: 'DELETE' })
      const response = await deletePerformer(request, { params: Promise.resolve({ slug: 'test-performer' }) })
      const data = await getResponseJson<{ success: boolean }>(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify deletion
      const dbPerformer = await prisma.performer.findUnique({ where: { slug: 'test-performer' } })
      expect(dbPerformer).toBeNull()
    })

    it('should return 404 for non-existent performer', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/performers/non-existent', { method: 'DELETE' })
      const response = await deletePerformer(request, { params: Promise.resolve({ slug: 'non-existent' }) })
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Performer no encontrada')
    })
  })
})
