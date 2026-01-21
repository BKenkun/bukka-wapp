import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockRequest, getResponseJson } from '../test-utils'
import {
  prisma,
  cleanupDatabase,
  createAdminUser,
  createProduct,
  createPerformer,
  createShopCategory,
  linkProductToCategory,
} from '../helpers'
import { setMockSession, clearMockSession, createAdminSession, createMockSession } from '../../mocks/auth'

// Mock the auth module
vi.mock('@/auth', () => import('../../mocks/auth'))
vi.mock('@/lib/auth', () => import('../../mocks/auth'))

// Import routes after mocking
const { GET: getProducts, POST: createProductRoute } = await import('@/app/api/products/route')

describe('Products API - CRUD Operations', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    clearMockSession()
  })

  describe('GET /api/products', () => {
    it('should return empty list when no products exist', async () => {
      const request = createMockRequest('/api/products')
      const response = await getProducts(request)
      const data = await getResponseJson<{ products: unknown[]; pagination: { total: number } }>(response)

      expect(response.status).toBe(200)
      expect(data.products).toEqual([])
      expect(data.pagination.total).toBe(0)
    })

    it('should return only active products', async () => {
      await createProduct({ name: 'Active Product', status: 'ACTIVE' })
      await createProduct({ name: 'Draft Product', status: 'DRAFT' })

      const request = createMockRequest('/api/products')
      const response = await getProducts(request)
      const data = await getResponseJson<{ products: { name: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.products).toHaveLength(1)
      expect(data.products[0].name).toBe('Active Product')
    })

    it('should paginate results', async () => {
      // Create 15 products
      for (let i = 0; i < 15; i++) {
        await createProduct({ name: `Product ${i}`, status: 'ACTIVE' })
      }

      const request = createMockRequest('/api/products', {
        searchParams: { page: '1', limit: '10' },
      })
      const response = await getProducts(request)
      const data = await getResponseJson<{ products: unknown[]; pagination: { total: number; totalPages: number } }>(
        response
      )

      expect(response.status).toBe(200)
      expect(data.products).toHaveLength(10)
      expect(data.pagination.total).toBe(15)
      expect(data.pagination.totalPages).toBe(2)
    })

    it('should filter by category', async () => {
      const category = await createShopCategory({ name: 'Test Category', slug: 'test-category' })
      const product1 = await createProduct({ name: 'Categorized Product', status: 'ACTIVE' })
      await createProduct({ name: 'Other Product', status: 'ACTIVE' })
      await linkProductToCategory(product1.id, category.id)

      const request = createMockRequest('/api/products', {
        searchParams: { category: 'test-category' },
      })
      const response = await getProducts(request)
      const data = await getResponseJson<{ products: { name: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.products).toHaveLength(1)
      expect(data.products[0].name).toBe('Categorized Product')
    })

    it('should filter by performer', async () => {
      const performer = await createPerformer({ name: 'Test Performer', slug: 'test-performer' })
      await createProduct({ name: 'Performer Product', status: 'ACTIVE', performerId: performer.id })
      await createProduct({ name: 'Other Product', status: 'ACTIVE' })

      const request = createMockRequest('/api/products', {
        searchParams: { performer: 'test-performer' },
      })
      const response = await getProducts(request)
      const data = await getResponseJson<{ products: { name: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.products).toHaveLength(1)
      expect(data.products[0].name).toBe('Performer Product')
    })

    it('should search by name', async () => {
      await createProduct({ name: 'Special Item', status: 'ACTIVE' })
      await createProduct({ name: 'Regular Product', status: 'ACTIVE' })

      const request = createMockRequest('/api/products', {
        searchParams: { search: 'Special' },
      })
      const response = await getProducts(request)
      const data = await getResponseJson<{ products: { name: string }[] }>(response)

      expect(response.status).toBe(200)
      expect(data.products).toHaveLength(1)
      expect(data.products[0].name).toBe('Special Item')
    })

    it('should sort by price', async () => {
      await createProduct({ name: 'Cheap', price: 10, status: 'ACTIVE' })
      await createProduct({ name: 'Expensive', price: 100, status: 'ACTIVE' })

      const requestAsc = createMockRequest('/api/products', {
        searchParams: { sort: 'price', order: 'asc' },
      })
      const responseAsc = await getProducts(requestAsc)
      const dataAsc = await getResponseJson<{ products: { name: string }[] }>(responseAsc)

      expect(dataAsc.products[0].name).toBe('Cheap')
      expect(dataAsc.products[1].name).toBe('Expensive')

      const requestDesc = createMockRequest('/api/products', {
        searchParams: { sort: 'price', order: 'desc' },
      })
      const responseDesc = await getProducts(requestDesc)
      const dataDesc = await getResponseJson<{ products: { name: string }[] }>(responseDesc)

      expect(dataDesc.products[0].name).toBe('Expensive')
      expect(dataDesc.products[1].name).toBe('Cheap')
    })
  })

  describe('POST /api/products', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()

      const request = createMockRequest('/api/products', {
        method: 'POST',
        body: {
          name: 'New Product',
          slug: 'new-product',
          price: 29.99,
        },
      })
      const response = await createProductRoute(request)
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autorizado')
    })

    it('should return 403 when user is not admin', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com', password: 'test', isAdmin: false },
      })
      setMockSession(createMockSession({ userId: user.id, isAdmin: false }))

      const request = createMockRequest('/api/products', {
        method: 'POST',
        body: {
          name: 'New Product',
          slug: 'new-product',
          price: 29.99,
        },
      })
      const response = await createProductRoute(request)
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(403)
      expect(data.error).toBe('No autorizado')
    })

    it('should create product when admin', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/products', {
        method: 'POST',
        body: {
          name: 'New Product',
          slug: 'new-product',
          description: 'A test product',
          price: 29.99,
          stock: 50,
          status: 'DRAFT',
        },
      })
      const response = await createProductRoute(request)
      const data = await getResponseJson<{ name: string; slug: string; price: number }>(response)

      expect(response.status).toBe(201)
      expect(data.name).toBe('New Product')
      expect(data.slug).toBe('new-product')

      // Verify in database
      const dbProduct = await prisma.product.findUnique({ where: { slug: 'new-product' } })
      expect(dbProduct).toBeDefined()
      expect(dbProduct?.stock).toBe(50)
    })

    it('should return 400 for duplicate slug', async () => {
      await createProduct({ slug: 'existing-slug' })
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/products', {
        method: 'POST',
        body: {
          name: 'New Product',
          slug: 'existing-slug',
          price: 29.99,
        },
      })
      const response = await createProductRoute(request)
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Ya existe un producto con ese slug')
    })

    it('should return 400 for duplicate SKU', async () => {
      await prisma.product.create({
        data: { name: 'Existing', slug: 'existing', price: 10, sku: 'SKU123' },
      })
      const admin = await createAdminUser('GLOBAL_ADMIN')
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/products', {
        method: 'POST',
        body: {
          name: 'New Product',
          slug: 'new-product',
          price: 29.99,
          sku: 'SKU123',
        },
      })
      const response = await createProductRoute(request)
      const data = await getResponseJson<{ error: string }>(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Ya existe un producto con ese SKU')
    })

    it('should create product with categories', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      const category = await createShopCategory()
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/products', {
        method: 'POST',
        body: {
          name: 'New Product',
          slug: 'new-product-with-category',
          price: 29.99,
          categoryIds: [category.id],
        },
      })
      const response = await createProductRoute(request)
      const data = await getResponseJson<{
        categories: { category: { id: string } }[]
      }>(response)

      expect(response.status).toBe(201)
      expect(data.categories).toHaveLength(1)
      expect(data.categories[0].category.id).toBe(category.id)
    })

    it('should create product with performer', async () => {
      const admin = await createAdminUser('GLOBAL_ADMIN')
      const performer = await createPerformer()
      setMockSession(createAdminSession(admin.id, 'GLOBAL_ADMIN'))

      const request = createMockRequest('/api/products', {
        method: 'POST',
        body: {
          name: 'New Product',
          slug: 'new-product-with-performer',
          price: 29.99,
          performerId: performer.id,
        },
      })
      const response = await createProductRoute(request)
      const data = await getResponseJson<{
        performer: { id: string }
      }>(response)

      expect(response.status).toBe(201)
      expect(data.performer.id).toBe(performer.id)
    })
  })
})
