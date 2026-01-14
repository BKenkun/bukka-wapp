import { vi } from 'vitest'

// Mock session type
export interface MockSession {
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
    isAdmin: boolean
    adminRole: string | null
    SubscriptionPlan: {
      id: string
      slug: string
      name: string
      level: number
      maxVideoQuality: string
      canComment: boolean
      canAccessForum: boolean
      canDownload: boolean
      canAccessExclusive: boolean
      canAccessLimitedEdition: boolean
      shopDiscount: number
    } | null
    subscriptionEnd: Date | null
  }
}

// State to hold the current mock session
let currentMockSession: MockSession | null = null

// Mock auth function
export const auth = vi.fn().mockImplementation(async () => currentMockSession)

// Mock sign functions
export const signIn = vi.fn()
export const signOut = vi.fn()
export const handlers = {
  GET: vi.fn(),
  POST: vi.fn(),
}

// Helper to set mock session
export function setMockSession(session: MockSession | null) {
  currentMockSession = session
  auth.mockResolvedValue(session)
}

// Helper to clear mock session
export function clearMockSession() {
  currentMockSession = null
  auth.mockResolvedValue(null)
}

// Helper to create a mock session for a user
export function createMockSession(options: {
  userId: string
  email?: string
  name?: string
  isAdmin?: boolean
  adminRole?: string | null
  subscriptionPlan?: MockSession['user']['SubscriptionPlan']
  subscriptionEnd?: Date | null
}): MockSession {
  return {
    user: {
      id: options.userId,
      email: options.email || 'test@example.com',
      name: options.name || 'Test User',
      image: null,
      isAdmin: options.isAdmin || false,
      adminRole: options.adminRole || null,
      SubscriptionPlan: options.subscriptionPlan || null,
      subscriptionEnd: options.subscriptionEnd || null,
    },
  }
}

// Helper to create admin session
export function createAdminSession(
  userId: string,
  role: 'GLOBAL_ADMIN' | 'CONTENT_EDITOR' | 'ECOMMERCE_MANAGER' | 'FINANCE_MANAGER' | 'COMMUNITY_MODERATOR' = 'GLOBAL_ADMIN'
): MockSession {
  return createMockSession({
    userId,
    isAdmin: true,
    adminRole: role,
  })
}
