import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/register/route'
import { createMockRequest, getResponseJson } from '../test-utils'
import { prisma, cleanupDatabase, createUser } from '../helpers'

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  it('should register a new user successfully', async () => {
    const request = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    })

    const response = await POST(request)
    const data = await getResponseJson<{ message: string; user: { id: string; name: string; email: string } }>(response)

    expect(response.status).toBe(201)
    expect(data.message).toBe('Usuario creado correctamente')
    expect(data.user.email).toBe('test@example.com')
    expect(data.user.name).toBe('Test User')
    expect(data.user.id).toBeDefined()

    // Verify user was created in database
    const dbUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    })
    expect(dbUser).toBeDefined()
    expect(dbUser?.name).toBe('Test User')
  })

  it('should return 400 for invalid email', async () => {
    const request = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      },
    })

    const response = await POST(request)
    const data = await getResponseJson<{ error: string }>(response)

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email inválido')
  })

  it('should return 400 for short password', async () => {
    const request = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: '12345', // 5 characters, minimum is 6
      },
    })

    const response = await POST(request)
    const data = await getResponseJson<{ error: string }>(response)

    expect(response.status).toBe(400)
    expect(data.error).toBe('La contraseña debe tener al menos 6 caracteres')
  })

  it('should return 400 for short name', async () => {
    const request = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'A', // 1 character, minimum is 2
        email: 'test@example.com',
        password: 'password123',
      },
    })

    const response = await POST(request)
    const data = await getResponseJson<{ error: string }>(response)

    expect(response.status).toBe(400)
    expect(data.error).toBe('El nombre debe tener al menos 2 caracteres')
  })

  it('should return 400 when email already exists', async () => {
    // Create existing user
    await createUser({ email: 'existing@example.com' })

    const request = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      },
    })

    const response = await POST(request)
    const data = await getResponseJson<{ error: string }>(response)

    expect(response.status).toBe(400)
    expect(data.error).toBe('Ya existe una cuenta con este email')
  })

  it('should hash the password before storing', async () => {
    const request = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    })

    await POST(request)

    const dbUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    })

    expect(dbUser?.password).not.toBe('password123')
    expect(dbUser?.password.length).toBeGreaterThan(20) // bcrypt hashes are longer
  })
})
