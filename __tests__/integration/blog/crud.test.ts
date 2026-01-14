import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockRequest, getResponseJson } from '../test-utils'
import {
  prisma,
  cleanupDatabase,
  createUser,
  createAdminUser,
  createBlogPost,
  createBlogCategory,
} from '../helpers'
import { setMockSession, clearMockSession, createAdminSession, createMockSession } from '../../mocks/auth'

// Mock the auth module
vi.mock('@/auth', () => import('../../mocks/auth'))
vi.mock('@/lib/auth', () => import('../../mocks/auth'))

// Import routes after mocking
const { GET: getBlogPosts, POST: createBlogPostRoute } = await import('@/app/api/blog/route')
const { GET: getBlogPost, PATCH: updateBlogPost, DELETE: deleteBlogPost } = await import('@/app/api/blog/[id]/route')

describe('Blog API - CRUD Operations', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    clearMockSession()
  })

  describe('GET /api/blog', () => {
    it('should return empty list when no posts exist', async () => {
      const request = createMockRequest('/api/blog')
      const response = await getBlogPosts(request)
      const data = await getResponseJson<{ posts: unknown[]; pagination: { total: number } }>(response)

      expect(response.status).toBe(200)
      expect(data.posts).toEqual([])
      expect(data.pagination.total).toBe(0)
    })

    it('should return only published posts', async () => {
      const author = await createUser()
      await createBlogPost({ authorId: author.id, title: 'Published', status: 'PUBLISHED' })
      await createBlogPost({ authorId: author.id, title: 'Draft', status: 'DRAFT' })

      const request = createMockRequest('/api/blog')
      const response = await getBlogPosts(request)
      const data = await getResponseJson<{ posts: { title: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].title).toBe('Published')
    })

    it('should filter by category', async () => {
      const author = await createUser()
      const category = await createBlogCategory({ slug: 'news' })
      await createBlogPost({ authorId: author.id, title: 'News Post', categoryId: category.id, status: 'PUBLISHED' })
      await createBlogPost({ authorId: author.id, title: 'Other Post', status: 'PUBLISHED' })

      const request = createMockRequest('/api/blog', { searchParams: { category: 'news' } })
      const response = await getBlogPosts(request)
      const data = await getResponseJson<{ posts: { title: string }[] }>(response)

      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].title).toBe('News Post')
    })

    it('should paginate results', async () => {
      const author = await createUser()
      for (let i = 0; i < 15; i++) {
        await createBlogPost({ authorId: author.id, title: `Post ${i}`, status: 'PUBLISHED' })
      }

      const request = createMockRequest('/api/blog', { searchParams: { page: '1', limit: '10' } })
      const response = await getBlogPosts(request)
      const data = await getResponseJson<{ posts: unknown[]; pagination: { total: number; totalPages: number } }>(response)

      expect(data.posts).toHaveLength(10)
      expect(data.pagination.total).toBe(15)
      expect(data.pagination.totalPages).toBe(2)
    })
  })

  describe('GET /api/blog/[id]', () => {
    it('should return 404 for non-existent post', async () => {
      const request = createMockRequest('/api/blog/non-existent')
      const response = await getBlogPost(request, { params: Promise.resolve({ id: 'non-existent' }) })

      expect(response.status).toBe(404)
    })

    it('should return post details', async () => {
      const author = await createUser()
      const post = await createBlogPost({ authorId: author.id, title: 'Test Post', content: 'Content here' })

      const request = createMockRequest(`/api/blog/${post.id}`)
      const response = await getBlogPost(request, { params: Promise.resolve({ id: post.id }) })
      const data = await getResponseJson<{ title: string; content: string }>(response)

      expect(response.status).toBe(200)
      expect(data.title).toBe('Test Post')
      expect(data.content).toBe('Content here')
    })
  })

  describe('POST /api/blog', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()

      const request = createMockRequest('/api/blog', {
        method: 'POST',
        body: { title: 'New Post', slug: 'new-post', content: 'Content' },
      })
      const response = await createBlogPostRoute(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 when user is not admin', async () => {
      const user = await createUser()
      setMockSession(createMockSession({ userId: user.id, isAdmin: false }))

      const request = createMockRequest('/api/blog', {
        method: 'POST',
        body: { title: 'New Post', slug: 'new-post', content: 'Content' },
      })
      const response = await createBlogPostRoute(request)

      expect(response.status).toBe(403)
    })

    it('should create blog post when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/blog', {
        method: 'POST',
        body: { title: 'New Post', slug: 'new-post', content: 'Content', status: 'DRAFT' },
      })
      const response = await createBlogPostRoute(request)
      const data = await getResponseJson<{ title: string; slug: string }>(response)

      expect(response.status).toBe(201)
      expect(data.title).toBe('New Post')
      expect(data.slug).toBe('new-post')
    })

    it('should return 400 for duplicate slug', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      await createBlogPost({ authorId: admin.id, slug: 'existing-slug' })
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/blog', {
        method: 'POST',
        body: { title: 'New Post', slug: 'existing-slug', content: 'Content' },
      })
      const response = await createBlogPostRoute(request)

      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/blog/[id]', () => {
    it('should update blog post when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      const post = await createBlogPost({ authorId: admin.id, title: 'Original' })
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest(`/api/blog/${post.id}`, {
        method: 'PATCH',
        body: { title: 'Updated Title' },
      })
      const response = await updateBlogPost(request, { params: Promise.resolve({ id: post.id }) })
      const data = await getResponseJson<{ title: string }>(response)

      expect(response.status).toBe(200)
      expect(data.title).toBe('Updated Title')
    })

    it('should set publishedAt when publishing', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      const post = await createBlogPost({ authorId: admin.id, status: 'DRAFT' })
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest(`/api/blog/${post.id}`, {
        method: 'PATCH',
        body: { status: 'PUBLISHED' },
      })
      const response = await updateBlogPost(request, { params: Promise.resolve({ id: post.id }) })
      const data = await getResponseJson<{ publishedAt: string }>(response)

      expect(response.status).toBe(200)
      expect(data.publishedAt).toBeDefined()
    })
  })

  describe('DELETE /api/blog/[id]', () => {
    it('should delete blog post when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      const post = await createBlogPost({ authorId: admin.id })
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest(`/api/blog/${post.id}`, { method: 'DELETE' })
      const response = await deleteBlogPost(request, { params: Promise.resolve({ id: post.id }) })

      expect(response.status).toBe(200)

      // Verify deletion
      const deleted = await prisma.blogPost.findUnique({ where: { id: post.id } })
      expect(deleted).toBeNull()
    })
  })
})
