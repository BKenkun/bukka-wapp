import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockRequest, getResponseJson } from '../test-utils'
import {
  prisma,
  cleanupDatabase,
  createUser,
  createProduct,
  createCart,
  addToCart,
} from '../helpers'
import { setMockSession, clearMockSession, createMockSession } from '../../mocks/auth'

// Mock the auth module
vi.mock('@/auth', () => import('../../mocks/auth'))
vi.mock('@/lib/auth', () => import('../../mocks/auth'))

// Import routes after mocking
const { GET: getCart, POST: addToCartRoute, PATCH: updateCart, DELETE: removeFromCart } = await import('@/app/api/cart/route')

describe('Cart API - CRUD Operations', () => {
  beforeEach(async () => {
    await cleanupDatabase()
    clearMockSession()
  })

  describe('GET /api/cart', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()
      const response = await getCart()

      expect(response.status).toBe(401)
    })

    it('should create empty cart if none exists', async () => {
      const user = await createUser()
      setMockSession(createMockSession({ userId: user.id }))

      const response = await getCart()
      const data = await getResponseJson<{ cart: { items: unknown[]; itemCount: number } }>(response)

      expect(response.status).toBe(200)
      expect(data.cart.items).toEqual([])
      expect(data.cart.itemCount).toBe(0)
    })

    it('should return cart with items', async () => {
      const user = await createUser()
      const product = await createProduct({ name: 'Test Product', price: 29.99, status: 'ACTIVE' })
      const cart = await createCart(user.id)
      await addToCart(cart.id, product.id, 2)
      setMockSession(createMockSession({ userId: user.id }))

      const response = await getCart()
      const data = await getResponseJson<{ cart: { items: { quantity: number }[]; subtotal: number } }>(response)

      expect(response.status).toBe(200)
      expect(data.cart.items).toHaveLength(1)
      expect(data.cart.items[0].quantity).toBe(2)
      expect(data.cart.subtotal).toBeCloseTo(59.98, 2)
    })

    it('should apply subscription discount', async () => {
      const plan = await prisma.subscriptionPlan.create({
        data: { name: 'Premium', slug: 'premium', shopDiscount: 10, level: 1 },
      })
      const user = await createUser({ subscriptionPlanId: plan.id })
      const product = await createProduct({ price: 100, status: 'ACTIVE' })
      const cart = await createCart(user.id)
      await addToCart(cart.id, product.id, 1)
      setMockSession(createMockSession({ userId: user.id }))

      const response = await getCart()
      const data = await getResponseJson<{ cart: { subtotal: number; discount: number; total: number } }>(response)

      expect(data.cart.subtotal).toBe(100)
      expect(data.cart.discount).toBe(10)
      expect(data.cart.total).toBe(90)
    })
  })

  describe('POST /api/cart', () => {
    it('should return 401 when not authenticated', async () => {
      clearMockSession()
      const request = createMockRequest('/api/cart', {
        method: 'POST',
        body: { productId: 'prod-1', quantity: 1 },
      })
      const response = await addToCartRoute(request)

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent product', async () => {
      const user = await createUser()
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/cart', {
        method: 'POST',
        body: { productId: 'non-existent', quantity: 1 },
      })
      const response = await addToCartRoute(request)

      expect(response.status).toBe(404)
    })

    it('should return 400 for inactive product', async () => {
      const user = await createUser()
      const product = await createProduct({ status: 'DRAFT' })
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/cart', {
        method: 'POST',
        body: { productId: product.id, quantity: 1 },
      })
      const response = await addToCartRoute(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 when not enough stock', async () => {
      const user = await createUser()
      const product = await createProduct({ status: 'ACTIVE', stock: 5 })
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/cart', {
        method: 'POST',
        body: { productId: product.id, quantity: 10 },
      })
      const response = await addToCartRoute(request)

      expect(response.status).toBe(400)
    })

    it('should add product to cart', async () => {
      const user = await createUser()
      const product = await createProduct({ status: 'ACTIVE', stock: 10 })
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/cart', {
        method: 'POST',
        body: { productId: product.id, quantity: 2 },
      })
      const response = await addToCartRoute(request)

      expect(response.status).toBe(201)

      // Verify item in cart
      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: { items: true },
      })
      expect(cart?.items).toHaveLength(1)
      expect(cart?.items[0].quantity).toBe(2)
    })

    it('should increase quantity if product already in cart', async () => {
      const user = await createUser()
      const product = await createProduct({ status: 'ACTIVE', stock: 10 })
      const cart = await createCart(user.id)
      await addToCart(cart.id, product.id, 2)
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/cart', {
        method: 'POST',
        body: { productId: product.id, quantity: 3 },
      })
      await addToCartRoute(request)

      // Verify quantity increased
      const updatedCart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: { items: true },
      })
      expect(updatedCart?.items[0].quantity).toBe(5)
    })
  })

  describe('PATCH /api/cart', () => {
    it('should update item quantity', async () => {
      const user = await createUser()
      const product = await createProduct({ status: 'ACTIVE', stock: 10 })
      const cart = await createCart(user.id)
      const item = await addToCart(cart.id, product.id, 2)
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/cart', {
        method: 'PATCH',
        body: { itemId: item.id, quantity: 5 },
      })
      const response = await updateCart(request)

      expect(response.status).toBe(200)

      const updatedItem = await prisma.cartItem.findUnique({ where: { id: item.id } })
      expect(updatedItem?.quantity).toBe(5)
    })

    it('should remove item when quantity is 0', async () => {
      const user = await createUser()
      const product = await createProduct({ status: 'ACTIVE' })
      const cart = await createCart(user.id)
      const item = await addToCart(cart.id, product.id, 2)
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/cart', {
        method: 'PATCH',
        body: { itemId: item.id, quantity: 0 },
      })
      const response = await updateCart(request)

      expect(response.status).toBe(200)

      const deletedItem = await prisma.cartItem.findUnique({ where: { id: item.id } })
      expect(deletedItem).toBeNull()
    })

    it('should return 404 for item not in user cart', async () => {
      const user1 = await createUser()
      const user2 = await createUser()
      const product = await createProduct({ status: 'ACTIVE' })
      const cart = await createCart(user2.id)
      const item = await addToCart(cart.id, product.id, 2)
      setMockSession(createMockSession({ userId: user1.id }))

      const request = createMockRequest('/api/cart', {
        method: 'PATCH',
        body: { itemId: item.id, quantity: 5 },
      })
      const response = await updateCart(request)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/cart', () => {
    it('should remove item from cart', async () => {
      const user = await createUser()
      const product = await createProduct({ status: 'ACTIVE' })
      const cart = await createCart(user.id)
      const item = await addToCart(cart.id, product.id, 2)
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/cart', {
        method: 'DELETE',
        searchParams: { itemId: item.id },
      })
      const response = await removeFromCart(request)

      expect(response.status).toBe(200)

      const deletedItem = await prisma.cartItem.findUnique({ where: { id: item.id } })
      expect(deletedItem).toBeNull()
    })

    it('should return 400 when itemId not provided', async () => {
      const user = await createUser()
      setMockSession(createMockSession({ userId: user.id }))

      const request = createMockRequest('/api/cart', { method: 'DELETE' })
      const response = await removeFromCart(request)

      expect(response.status).toBe(400)
    })
  })
})
