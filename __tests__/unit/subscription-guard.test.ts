import { describe, it, expect } from 'vitest'
import {
  isSubscriptionExpired,
  isPlanLevelAtLeast,
  canUserComment,
  canUserAccessForum,
  canUserDownload,
  getShopDiscount,
  applySubscriptionDiscount,
  getMaxVideoQuality,
  canWatchInQuality,
  type VideoQuality,
} from '@/lib/subscription-guard'

// Mock subscription plan for tests
const createMockPlan = (overrides = {}) => ({
  id: 'plan-1',
  slug: 'basic',
  name: 'Basic',
  level: 1,
  maxVideoQuality: '720p',
  canComment: false,
  canAccessForum: false,
  canDownload: false,
  canAccessLimitedEdition: false,
  canAccessExclusive: false,
  shopDiscount: 0,
  isFree: true,
  ...overrides,
})

describe('Subscription Guard - Pure Functions', () => {
  describe('isSubscriptionExpired', () => {
    it('should return false for null subscription end date', () => {
      expect(isSubscriptionExpired(null)).toBe(false)
    })

    it('should return false for future subscription end date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      expect(isSubscriptionExpired(futureDate)).toBe(false)
    })

    it('should return true for past subscription end date', () => {
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 1)
      expect(isSubscriptionExpired(pastDate)).toBe(true)
    })

    it('should return true for subscription that expired yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isSubscriptionExpired(yesterday)).toBe(true)
    })

    it('should return false for subscription expiring tomorrow', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isSubscriptionExpired(tomorrow)).toBe(false)
    })
  })

  describe('isPlanLevelAtLeast', () => {
    it('should return true when user level equals required level', () => {
      expect(isPlanLevelAtLeast(2, 2)).toBe(true)
    })

    it('should return true when user level exceeds required level', () => {
      expect(isPlanLevelAtLeast(3, 1)).toBe(true)
    })

    it('should return false when user level is below required level', () => {
      expect(isPlanLevelAtLeast(1, 3)).toBe(false)
    })

    it('should handle level 0', () => {
      expect(isPlanLevelAtLeast(0, 0)).toBe(true)
      expect(isPlanLevelAtLeast(0, 1)).toBe(false)
      expect(isPlanLevelAtLeast(1, 0)).toBe(true)
    })
  })

  describe('canUserComment', () => {
    it('should return false for null plan', () => {
      expect(canUserComment(null)).toBe(false)
    })

    it('should return false when plan does not allow comments', () => {
      const plan = createMockPlan({ canComment: false })
      expect(canUserComment(plan)).toBe(false)
    })

    it('should return true when plan allows comments', () => {
      const plan = createMockPlan({ canComment: true })
      expect(canUserComment(plan)).toBe(true)
    })
  })

  describe('canUserAccessForum', () => {
    it('should return false for null plan', () => {
      expect(canUserAccessForum(null)).toBe(false)
    })

    it('should return false when plan does not allow forum access', () => {
      const plan = createMockPlan({ canAccessForum: false })
      expect(canUserAccessForum(plan)).toBe(false)
    })

    it('should return true when plan allows forum access', () => {
      const plan = createMockPlan({ canAccessForum: true })
      expect(canUserAccessForum(plan)).toBe(true)
    })
  })

  describe('canUserDownload', () => {
    it('should return false for null plan', () => {
      expect(canUserDownload(null)).toBe(false)
    })

    it('should return false when plan does not allow downloads', () => {
      const plan = createMockPlan({ canDownload: false })
      expect(canUserDownload(plan)).toBe(false)
    })

    it('should return true when plan allows downloads', () => {
      const plan = createMockPlan({ canDownload: true })
      expect(canUserDownload(plan)).toBe(true)
    })
  })

  describe('getShopDiscount', () => {
    it('should return 0 for null plan', () => {
      expect(getShopDiscount(null)).toBe(0)
    })

    it('should return plan discount when plan has discount', () => {
      const plan = createMockPlan({ shopDiscount: 15 })
      expect(getShopDiscount(plan)).toBe(15)
    })

    it('should return 0 when plan has no discount', () => {
      const plan = createMockPlan({ shopDiscount: 0 })
      expect(getShopDiscount(plan)).toBe(0)
    })
  })

  describe('applySubscriptionDiscount', () => {
    it('should return original price for null plan', () => {
      expect(applySubscriptionDiscount(100, null)).toBe(100)
    })

    it('should return original price when no discount', () => {
      const plan = createMockPlan({ shopDiscount: 0 })
      expect(applySubscriptionDiscount(100, plan)).toBe(100)
    })

    it('should apply 10% discount correctly', () => {
      const plan = createMockPlan({ shopDiscount: 10 })
      expect(applySubscriptionDiscount(100, plan)).toBe(90)
    })

    it('should apply 25% discount correctly', () => {
      const plan = createMockPlan({ shopDiscount: 25 })
      expect(applySubscriptionDiscount(100, plan)).toBe(75)
    })

    it('should handle decimal prices', () => {
      const plan = createMockPlan({ shopDiscount: 20 })
      expect(applySubscriptionDiscount(49.99, plan)).toBeCloseTo(39.992, 2)
    })

    it('should apply 100% discount (free)', () => {
      const plan = createMockPlan({ shopDiscount: 100 })
      expect(applySubscriptionDiscount(100, plan)).toBe(0)
    })
  })

  describe('getMaxVideoQuality', () => {
    it('should return 720p for null plan', () => {
      expect(getMaxVideoQuality(null)).toBe('720p')
    })

    it('should return plan max quality', () => {
      const plan480 = createMockPlan({ maxVideoQuality: '480p' })
      const plan1080 = createMockPlan({ maxVideoQuality: '1080p' })
      const plan4k = createMockPlan({ maxVideoQuality: '4k' })

      expect(getMaxVideoQuality(plan480)).toBe('480p')
      expect(getMaxVideoQuality(plan1080)).toBe('1080p')
      expect(getMaxVideoQuality(plan4k)).toBe('4k')
    })
  })

  describe('canWatchInQuality', () => {
    it('should return false when video does not have requested quality', () => {
      const plan = createMockPlan({ maxVideoQuality: '4k' })
      expect(canWatchInQuality(plan, '1080p', false)).toBe(false)
    })

    it('should return true when requesting same quality as max', () => {
      const plan = createMockPlan({ maxVideoQuality: '720p' })
      expect(canWatchInQuality(plan, '720p', true)).toBe(true)
    })

    it('should return true when requesting lower quality than max', () => {
      const plan = createMockPlan({ maxVideoQuality: '1080p' })
      expect(canWatchInQuality(plan, '480p', true)).toBe(true)
      expect(canWatchInQuality(plan, '720p', true)).toBe(true)
    })

    it('should return false when requesting higher quality than max', () => {
      const plan = createMockPlan({ maxVideoQuality: '720p' })
      expect(canWatchInQuality(plan, '1080p', true)).toBe(false)
      expect(canWatchInQuality(plan, '4k', true)).toBe(false)
    })

    it('should use default 720p for null plan', () => {
      expect(canWatchInQuality(null, '480p', true)).toBe(true)
      expect(canWatchInQuality(null, '720p', true)).toBe(true)
      expect(canWatchInQuality(null, '1080p', true)).toBe(false)
      expect(canWatchInQuality(null, '4k', true)).toBe(false)
    })

    it('should handle all quality levels correctly', () => {
      const qualities: VideoQuality[] = ['480p', '720p', '1080p', '4k']

      // Plan with 4k should allow all qualities
      const plan4k = createMockPlan({ maxVideoQuality: '4k' })
      qualities.forEach(q => {
        expect(canWatchInQuality(plan4k, q, true)).toBe(true)
      })

      // Plan with 480p should only allow 480p
      const plan480 = createMockPlan({ maxVideoQuality: '480p' })
      expect(canWatchInQuality(plan480, '480p', true)).toBe(true)
      expect(canWatchInQuality(plan480, '720p', true)).toBe(false)
      expect(canWatchInQuality(plan480, '1080p', true)).toBe(false)
      expect(canWatchInQuality(plan480, '4k', true)).toBe(false)
    })
  })
})
