import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  getPermissionsForRole,
  canAccessRoute,
  ROUTE_PERMISSIONS,
  type AdminRole,
  type Permission,
} from '@/lib/admin-permissions'

describe('Admin Permissions', () => {
  describe('hasPermission', () => {
    it('should return false for null/undefined role', () => {
      expect(hasPermission(null, 'videos')).toBe(false)
      expect(hasPermission(undefined, 'videos')).toBe(false)
    })

    it('should return true for GLOBAL_ADMIN for any permission', () => {
      const permissions: Permission[] = [
        'dashboard', 'videos', 'performers', 'products', 'orders',
        'users', 'forum', 'settings', 'subscriptions', 'promo_codes',
      ]
      permissions.forEach(permission => {
        expect(hasPermission('GLOBAL_ADMIN', permission)).toBe(true)
      })
    })

    it('should return correct permissions for CONTENT_EDITOR', () => {
      // Should have access to
      expect(hasPermission('CONTENT_EDITOR', 'videos')).toBe(true)
      expect(hasPermission('CONTENT_EDITOR', 'performers')).toBe(true)
      expect(hasPermission('CONTENT_EDITOR', 'blog')).toBe(true)
      expect(hasPermission('CONTENT_EDITOR', 'pages')).toBe(true)
      expect(hasPermission('CONTENT_EDITOR', 'menus')).toBe(true)

      // Should NOT have access to
      expect(hasPermission('CONTENT_EDITOR', 'products')).toBe(false)
      expect(hasPermission('CONTENT_EDITOR', 'orders')).toBe(false)
      expect(hasPermission('CONTENT_EDITOR', 'users')).toBe(false)
      expect(hasPermission('CONTENT_EDITOR', 'settings')).toBe(false)
    })

    it('should return correct permissions for ECOMMERCE_MANAGER', () => {
      expect(hasPermission('ECOMMERCE_MANAGER', 'products')).toBe(true)
      expect(hasPermission('ECOMMERCE_MANAGER', 'shop_categories')).toBe(true)
      expect(hasPermission('ECOMMERCE_MANAGER', 'orders')).toBe(true)
      expect(hasPermission('ECOMMERCE_MANAGER', 'dashboard')).toBe(true)

      expect(hasPermission('ECOMMERCE_MANAGER', 'videos')).toBe(false)
      expect(hasPermission('ECOMMERCE_MANAGER', 'users')).toBe(false)
    })

    it('should return correct permissions for FINANCE_MANAGER', () => {
      expect(hasPermission('FINANCE_MANAGER', 'subscriptions')).toBe(true)
      expect(hasPermission('FINANCE_MANAGER', 'promo_codes')).toBe(true)
      expect(hasPermission('FINANCE_MANAGER', 'orders')).toBe(true)
      expect(hasPermission('FINANCE_MANAGER', 'dashboard')).toBe(true)

      expect(hasPermission('FINANCE_MANAGER', 'videos')).toBe(false)
      expect(hasPermission('FINANCE_MANAGER', 'products')).toBe(false)
    })

    it('should return correct permissions for COMMUNITY_MODERATOR', () => {
      expect(hasPermission('COMMUNITY_MODERATOR', 'users')).toBe(true)
      expect(hasPermission('COMMUNITY_MODERATOR', 'forum')).toBe(true)
      expect(hasPermission('COMMUNITY_MODERATOR', 'casting')).toBe(true)
      expect(hasPermission('COMMUNITY_MODERATOR', 'dashboard')).toBe(true)

      expect(hasPermission('COMMUNITY_MODERATOR', 'videos')).toBe(false)
      expect(hasPermission('COMMUNITY_MODERATOR', 'products')).toBe(false)
    })
  })

  describe('getPermissionsForRole', () => {
    it('should return all permissions for GLOBAL_ADMIN', () => {
      const permissions = getPermissionsForRole('GLOBAL_ADMIN')
      expect(permissions).toContain('dashboard')
      expect(permissions).toContain('videos')
      expect(permissions).toContain('performers')
      expect(permissions).toContain('products')
      expect(permissions).toContain('orders')
      expect(permissions).toContain('users')
      expect(permissions).toContain('settings')
      expect(permissions.length).toBeGreaterThan(15)
    })

    it('should return limited permissions for CONTENT_EDITOR', () => {
      const permissions = getPermissionsForRole('CONTENT_EDITOR')
      expect(permissions).toContain('videos')
      expect(permissions).toContain('performers')
      expect(permissions).not.toContain('products')
      expect(permissions).not.toContain('users')
    })

    it('should return limited permissions for ECOMMERCE_MANAGER', () => {
      const permissions = getPermissionsForRole('ECOMMERCE_MANAGER')
      expect(permissions).toContain('products')
      expect(permissions).toContain('orders')
      expect(permissions).not.toContain('videos')
    })
  })

  describe('canAccessRoute', () => {
    it('should always allow access to /admin dashboard', () => {
      expect(canAccessRoute(null, '/admin')).toBe(true)
      expect(canAccessRoute('CONTENT_EDITOR', '/admin')).toBe(true)
    })

    it('should check permissions for specific routes', () => {
      expect(canAccessRoute('CONTENT_EDITOR', '/admin/videos')).toBe(true)
      expect(canAccessRoute('CONTENT_EDITOR', '/admin/videos/new')).toBe(true)
      expect(canAccessRoute('CONTENT_EDITOR', '/admin/products')).toBe(false)

      expect(canAccessRoute('ECOMMERCE_MANAGER', '/admin/products')).toBe(true)
      expect(canAccessRoute('ECOMMERCE_MANAGER', '/admin/videos')).toBe(false)
    })

    it('should allow GLOBAL_ADMIN to access all routes', () => {
      expect(canAccessRoute('GLOBAL_ADMIN', '/admin/videos')).toBe(true)
      expect(canAccessRoute('GLOBAL_ADMIN', '/admin/products')).toBe(true)
      expect(canAccessRoute('GLOBAL_ADMIN', '/admin/settings')).toBe(true)
      expect(canAccessRoute('GLOBAL_ADMIN', '/admin/users')).toBe(true)
    })

    it('should handle nested routes', () => {
      expect(canAccessRoute('CONTENT_EDITOR', '/admin/videos/123/edit')).toBe(true)
      expect(canAccessRoute('CONTENT_EDITOR', '/admin/products/123/edit')).toBe(false)
    })

    it('should return true for unknown routes (not specifically protected)', () => {
      expect(canAccessRoute('CONTENT_EDITOR', '/admin/unknown-route')).toBe(true)
    })

    it('should return false for null role on protected routes', () => {
      expect(canAccessRoute(null, '/admin/videos')).toBe(false)
      expect(canAccessRoute(null, '/admin/products')).toBe(false)
    })
  })

  describe('ROUTE_PERMISSIONS mapping', () => {
    it('should have correct route to permission mappings', () => {
      expect(ROUTE_PERMISSIONS['/admin/videos']).toBe('videos')
      expect(ROUTE_PERMISSIONS['/admin/actrices']).toBe('performers')
      expect(ROUTE_PERMISSIONS['/admin/products']).toBe('products')
      expect(ROUTE_PERMISSIONS['/admin/orders']).toBe('orders')
      expect(ROUTE_PERMISSIONS['/admin/settings']).toBe('settings')
    })
  })
})
