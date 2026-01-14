import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockRequest, getResponseJson } from '../test-utils'
import {
  prisma,
  cleanupDatabase,
  createUser,
  createAdminUser,
  createForumCategory,
  createForumPost,
  createForumReply,
} from '../helpers'
import { setMockSession, clearMockSession, createAdminSession, createMockSession } from '../../mocks/auth'

// Mock the auth module
vi.mock('@/auth', () => import('../../mocks/auth'))
vi.mock('@/lib/auth', () => import('../../mocks/auth'))

// Import routes after mocking
const { GET: getCategories, POST: createCategoryRoute } = await import('@/app/api/forum/categories/route')
const { GET: getPosts, POST: createPostRoute } = await import('@/app/api/forum/posts/route')

describe('Forum API - CRUD Operations', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    clearMockSession()
  })

  describe('GET /api/forum/categories', () => {
    it('should return empty list when no categories exist', async () => {
      const response = await getCategories()
      const data = await getResponseJson<{ categories: unknown[] }>(response)

      expect(response.status).toBe(200)
      expect(data.categories).toEqual([])
    })

    it('should return all categories with post count', async () => {
      const user = await createUser()
      const category = await createForumCategory({ name: 'General', slug: 'general' })
      await createForumPost({ title: 'Post 1', content: 'Content', authorId: user.id, categoryId: category.id })
      await createForumPost({ title: 'Post 2', content: 'Content', authorId: user.id, categoryId: category.id })

      const response = await getCategories()
      const data = await getResponseJson<{ categories: { name: string; _count: { ForumPost: number } }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.categories).toHaveLength(1)
      expect(data.categories[0].name).toBe('General')
      expect(data.categories[0]._count.ForumPost).toBe(2)
    })
  })

  describe('POST /api/forum/categories', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()

      const request = createMockRequest('/api/forum/categories', {
        method: 'POST',
        body: { name: 'New Category', slug: 'new-category' },
      })
      const response = await createCategoryRoute(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 when user is not admin', async () => {
      const user = await createUser()
      setMockSession(createMockSession({ userId: user.id, isAdmin: false }))

      const request = createMockRequest('/api/forum/categories', {
        method: 'POST',
        body: { name: 'New Category', slug: 'new-category' },
      })
      const response = await createCategoryRoute(request)

      expect(response.status).toBe(403)
    })

    it('should create category when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/forum/categories', {
        method: 'POST',
        body: { name: 'New Category', slug: 'new-category', description: 'A test category' },
      })
      const response = await createCategoryRoute(request)
      const data = await getResponseJson<{ name: string; slug: string }>(response)

      expect(response.status).toBe(201)
      expect(data.name).toBe('New Category')
      expect(data.slug).toBe('new-category')
    })

    it('should return 400 for duplicate slug', async () => {
      await createForumCategory({ slug: 'existing' })
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/forum/categories', {
        method: 'POST',
        body: { name: 'New Category', slug: 'existing' },
      })
      const response = await createCategoryRoute(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/forum/posts', () => {
    it('should return empty list when no posts exist', async () => {
      const request = createMockRequest('/api/forum/posts')
      const response = await getPosts(request)
      const data = await getResponseJson<{ posts: unknown[] }>(response)

      expect(response.status).toBe(200)
      expect(data.posts).toEqual([])
    })

    it('should return posts with pagination', async () => {
      const user = await createUser()
      const category = await createForumCategory()
      for (let i = 0; i < 15; i++) {
        await createForumPost({ title: `Post ${i}`, content: 'Content', authorId: user.id, categoryId: category.id })
      }

      const request = createMockRequest('/api/forum/posts', { searchParams: { page: '1', limit: '10' } })
      const response = await getPosts(request)
      const data = await getResponseJson<{ posts: unknown[]; pagination: { totalCount: number } }>(response)

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(10)
      expect(data.pagination.totalCount).toBe(15)
    })

    it('should filter by category', async () => {
      const user = await createUser()
      const category1 = await createForumCategory({ slug: 'cat1' })
      const category2 = await createForumCategory({ slug: 'cat2' })
      await createForumPost({ title: 'Post in Cat1', content: 'Content', authorId: user.id, categoryId: category1.id })
      await createForumPost({ title: 'Post in Cat2', content: 'Content', authorId: user.id, categoryId: category2.id })

      const request = createMockRequest('/api/forum/posts', { searchParams: { categoryId: category1.id } })
      const response = await getPosts(request)
      const data = await getResponseJson<{ posts: { title: string }[] }>(response)

      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].title).toBe('Post in Cat1')
    })

    it('should show pinned posts first', async () => {
      const user = await createUser()
      const category = await createForumCategory()
      await createForumPost({ title: 'Normal Post', content: 'Content', authorId: user.id, categoryId: category.id, isPinned: false })
      await createForumPost({ title: 'Pinned Post', content: 'Content', authorId: user.id, categoryId: category.id, isPinned: true })

      const request = createMockRequest('/api/forum/posts')
      const response = await getPosts(request)
      const data = await getResponseJson<{ posts: { title: string }[] }>(response)

      expect(data.posts[0].title).toBe('Pinned Post')
    })
  })

  describe('POST /api/forum/posts', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()

      const request = createMockRequest('/api/forum/posts', {
        method: 'POST',
        body: { title: 'New Post', content: 'Content', categoryId: 'cat-id' },
      })
      const response = await createPostRoute(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 when missing required fields', async () => {
      const user = await createUser()
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/forum/posts', {
        method: 'POST',
        body: { title: 'New Post' }, // Missing content and categoryId
      })
      const response = await createPostRoute(request)

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent category', async () => {
      const user = await createUser()
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/forum/posts', {
        method: 'POST',
        body: { title: 'New Post', content: 'Content', categoryId: 'non-existent' },
      })
      const response = await createPostRoute(request)

      expect(response.status).toBe(404)
    })
  })
})
