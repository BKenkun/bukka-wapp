import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { createMockRequest, getResponseJson } from '../test-utils'
import {
  prisma,
  cleanupDatabase,
  createUser,
  createAdminUser,
  createVideo,
  createPerformer,
  createVideoCategory,
  createDefaultPlan,
  createPremiumPlan,
  linkVideoToPerformer,
  linkVideoToCategory,
} from '../helpers'
import { setMockSession, clearMockSession, createAdminSession, createMockSession } from '../../mocks/auth'

// Mock the auth module
vi.mock('@/auth', () => import('../../mocks/auth'))
vi.mock('@/lib/auth', () => import('../../mocks/auth'))

// Mock Mux client to avoid external calls
vi.mock('@/lib/mux/client', () => ({
  deleteMuxAsset: vi.fn().mockResolvedValue(undefined),
}))

// Mock file utils
vi.mock('@/lib/file-utils', () => ({
  deleteLocalFile: vi.fn().mockResolvedValue(undefined),
}))

// Import routes after mocking
const { GET: getVideos, POST: createVideoRoute } = await import('@/app/api/videos/route')
const { GET: getVideo, PATCH: updateVideo, DELETE: deleteVideo } = await import('@/app/api/videos/[slug]/route')

describe('Videos API - CRUD Operations', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    clearMockSession()
  })

  describe('GET /api/videos', () => {
    it('should return empty list when no videos exist', async () => {
      const request = createMockRequest('/api/videos')
      const response = await getVideos(request)
      const data = await getResponseJson<{ videos: unknown[]; pagination: { total: number } }>(response)

      expect(response.status).toBe(200)
      expect(data.videos).toEqual([])
      expect(data.pagination.total).toBe(0)
    })

    it('should return published videos only', async () => {
      await createVideo({ title: 'Published Video', status: 'PUBLISHED' })
      await createVideo({ title: 'Draft Video', status: 'DRAFT' })

      const request = createMockRequest('/api/videos')
      const response = await getVideos(request)
      const data = await getResponseJson<{ videos: { title: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.videos).toHaveLength(1)
      expect(data.videos[0].title).toBe('Published Video')
    })

    it('should paginate results', async () => {
      // Create 15 videos
      for (let i = 0; i < 15; i++) {
        await createVideo({ title: `Video ${i}`, status: 'PUBLISHED' })
      }

      const request = createMockRequest('/api/videos', {
        searchParams: { page: '1', limit: '10' },
      })
      const response = await getVideos(request)
      const data = await getResponseJson<{ videos: unknown[]; pagination: { total: number; totalPages: number } }>(
        response
      )

      expect(response.status).toBe(200)
      expect(data.videos).toHaveLength(10)
      expect(data.pagination.total).toBe(15)
      expect(data.pagination.totalPages).toBe(2)
    })

    it('should filter by category', async () => {
      const category = await createVideoCategory({ name: 'Test Category', slug: 'test-category' })
      const video1 = await createVideo({ title: 'Categorized Video', status: 'PUBLISHED' })
      await createVideo({ title: 'Other Video', status: 'PUBLISHED' })
      await linkVideoToCategory(video1.id, category.id)

      const request = createMockRequest('/api/videos', {
        searchParams: { category: 'test-category' },
      })
      const response = await getVideos(request)
      const data = await getResponseJson<{ videos: { title: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.videos).toHaveLength(1)
      expect(data.videos[0].title).toBe('Categorized Video')
    })

    it('should filter by performer', async () => {
      const performer = await createPerformer({ name: 'Test Performer', slug: 'test-performer' })
      const video1 = await createVideo({ title: 'Performer Video', status: 'PUBLISHED' })
      await createVideo({ title: 'Other Video', status: 'PUBLISHED' })
      await linkVideoToPerformer(video1.id, performer.id)

      const request = createMockRequest('/api/videos', {
        searchParams: { performer: 'test-performer' },
      })
      const response = await getVideos(request)
      const data = await getResponseJson<{ videos: { title: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.videos).toHaveLength(1)
      expect(data.videos[0].title).toBe('Performer Video')
    })

    it('should search by title', async () => {
      await createVideo({ title: 'Special Video', status: 'PUBLISHED' })
      await createVideo({ title: 'Another Content', status: 'PUBLISHED' })

      const request = createMockRequest('/api/videos', {
        searchParams: { search: 'Special' },
      })
      const response = await getVideos(request)
      const data = await getResponseJson<{ videos: { title: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.videos).toHaveLength(1)
      expect(data.videos[0].title).toBe('Special Video')
    })
  })

  describe('GET /api/videos/[slug]', () => {
    it('should return 404 for non-existent video', async () => {
      const request = createMockRequest('/api/videos/non-existent')
      const response = await getVideo(request, { params: Promise.resolve({ slug: 'non-existent' }) })
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Video no encontrado')
    })

    it('should return video details with access info', async () => {
      await createDefaultPlan()
      const video = await createVideo({
        title: 'Test Video',
        slug: 'test-video',
        status: 'PUBLISHED',
      })

      const request = createMockRequest('/api/videos/test-video')
      const response = await getVideo(request, { params: Promise.resolve({ slug: 'test-video' }) })
      const data = await getResponseJson<{
        title: string
        slug: string
        access: { hasAccess: boolean }
      }>(response)

      expect(response.status).toBe(200)
      expect(data.title).toBe('Test Video')
      expect(data.slug).toBe('test-video')
      expect(data.access).toBeDefined()
    })

    it('should increment view count on access', async () => {
      await createDefaultPlan()
      await createVideo({
        title: 'Test Video',
        slug: 'test-video',
        status: 'PUBLISHED',
      })

      // First request
      const request1 = createMockRequest('/api/videos/test-video')
      await getVideo(request1, { params: Promise.resolve({ slug: 'test-video' }) })

      // Second request
      const request2 = createMockRequest('/api/videos/test-video')
      const response = await getVideo(request2, { params: Promise.resolve({ slug: 'test-video' }) })
      const data = await getResponseJson<{ viewCount: number }>(response)

      expect(data.viewCount).toBeGreaterThanOrEqual(2)
    })
  })

  describe('POST /api/videos', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()

      const request = createMockRequest('/api/videos', {
        method: 'POST',
        body: {
          title: 'New Video',
          slug: 'new-video',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        },
      })
      const response = await createVideoRoute(request)
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autorizado')
    })

    it('should return 403 when user is not admin', async () => {
      const user = await createUser()
      setMockSession(createMockSession({ userId: user.id, isAdmin: false }))

      const request = createMockRequest('/api/videos', {
        method: 'POST',
        body: {
          title: 'New Video',
          slug: 'new-video',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        },
      })
      const response = await createVideoRoute(request)
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(403)
      expect(data.error).toBe('No autorizado')
    })

    it('should create video when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/videos', {
        method: 'POST',
        body: {
          title: 'New Video',
          slug: 'new-video',
          description: 'A test video',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          status: 'DRAFT',
        },
      })
      const response = await createVideoRoute(request)
      const data = await getResponseJson<{ title: string; slug: string }>(response)

      expect(response.status).toBe(201)
      expect(data.title).toBe('New Video')
      expect(data.slug).toBe('new-video')

      // Verify in database
      const dbVideo = await prisma.video.findUnique({ where: { slug: 'new-video' } })
      expect(dbVideo).toBeDefined()
    })

    it('should return 400 for duplicate slug', async () => {
      await createVideo({ slug: 'existing-slug' })
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/videos', {
        method: 'POST',
        body: {
          title: 'New Video',
          slug: 'existing-slug',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        },
      })
      const response = await createVideoRoute(request)
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Ya existe un video con ese slug')
    })

    it('should create video with performers and categories', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      const performer = await createPerformer()
      const category = await createVideoCategory()
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/videos', {
        method: 'POST',
        body: {
          title: 'New Video',
          slug: 'new-video-with-relations',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          performerIds: [performer.id],
          categoryIds: [category.id],
        },
      })
      const response = await createVideoRoute(request)
      const data = await getResponseJson<{
        performers: { performer: { id: string } }[]
        categories: { category: { id: string } }[]
      }>(response)

      expect(response.status).toBe(201)
      expect(data.performers).toHaveLength(1)
      expect(data.performers[0].performer.id).toBe(performer.id)
      expect(data.categories).toHaveLength(1)
      expect(data.categories[0].category.id).toBe(category.id)
    })
  })

  describe('PATCH /api/videos/[slug]', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()
      await createVideo({ slug: 'test-video' })

      const request = createMockRequest('/api/videos/test-video', {
        method: 'PATCH',
        body: { title: 'Updated Title' },
      })
      const response = await updateVideo(request, { params: Promise.resolve({ slug: 'test-video' }) })

      expect(response.status).toBe(401)
    })

    it('should update video when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      await createVideo({ slug: 'test-video', title: 'Original Title' })
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/videos/test-video', {
        method: 'PATCH',
        body: { title: 'Updated Title' },
      })
      const response = await updateVideo(request, { params: Promise.resolve({ slug: 'test-video' }) })
      const data = await getResponseJson<{ title: string }>(response)

      expect(response.status).toBe(200)
      expect(data.title).toBe('Updated Title')
    })

    it('should return 404 for non-existent video', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/videos/non-existent', {
        method: 'PATCH',
        body: { title: 'Updated Title' },
      })
      const response = await updateVideo(request, { params: Promise.resolve({ slug: 'non-existent' }) })
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Video no encontrado')
    })
  })

  describe('DELETE /api/videos/[slug]', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()
      await createVideo({ slug: 'test-video' })

      const request = createMockRequest('/api/videos/test-video', { method: 'DELETE' })
      const response = await deleteVideo(request, { params: Promise.resolve({ slug: 'test-video' }) })

      expect(response.status).toBe(401)
    })

    it('should delete video when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      await createVideo({ slug: 'test-video' })
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/videos/test-video', { method: 'DELETE' })
      const response = await deleteVideo(request, { params: Promise.resolve({ slug: 'test-video' }) })
      const data = await getResponseJson<{ success: boolean }>(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify deletion
      const dbVideo = await prisma.video.findUnique({ where: { slug: 'test-video' } })
      expect(dbVideo).toBeNull()
    })

    it('should return 404 for non-existent video', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/videos/non-existent', { method: 'DELETE' })
      const response = await deleteVideo(request, { params: Promise.resolve({ slug: 'non-existent' }) })
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Video no encontrado')
    })
  })
})
