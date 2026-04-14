import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

// Create prisma client with pg adapter (same as main app)
let _prisma: PrismaClient | null = null

function getPrismaClient(): PrismaClient {
  if (_prisma) return _prisma

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  _prisma = new PrismaClient({ adapter })
  return _prisma
}

// Export as getter
const prisma = getPrismaClient()

// ============================================
// Database cleanup helpers
// ============================================

/**
 * Clean all data from the test database
 * Order matters due to foreign key constraints
 */
export async function cleanupDatabase() {
  const tablenames = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')

  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  }
}

/**
 * Clean specific tables
 */
export async function cleanupTables(...tableNames: string[]) {
  for (const table of tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${table}" CASCADE;`)
  }
}

// ============================================
// User factories
// ============================================

interface CreateUserOptions {
  email?: string
  password?: string
  name?: string
  username?: string
  isAdmin?: boolean
  adminRole?: 'GLOBAL_ADMIN' | 'CONTENT_EDITOR' | 'ECOMMERCE_MANAGER' | 'FINANCE_MANAGER' | 'COMMUNITY_MODERATOR'
  subscriptionPlanId?: string
  subscriptionEnd?: Date | null
}

export async function createUser(options: CreateUserOptions = {}) {
  const hashedPassword = await bcrypt.hash(options.password || 'password123', 10)

  return prisma.user.create({
    data: {
      email: options.email || faker.internet.email(),
      password: hashedPassword,
      name: options.name || faker.person.fullName(),
      username: options.username || faker.internet.username().toLowerCase(),
      isAdmin: options.isAdmin || false,
      adminRole: options.adminRole || null,
      subscriptionPlanId: options.subscriptionPlanId || null,
      subscriptionEnd: options.subscriptionEnd,
    },
    include: {
      SubscriptionPlan: true,
    },
  })
}

export async function createAdminUser(
  role: 'GLOBAL_ADMIN' | 'CONTENT_EDITOR' | 'ECOMMERCE_MANAGER' | 'FINANCE_MANAGER' | 'COMMUNITY_MODERATOR' = 'GLOBAL_ADMIN'
) {
  return createUser({
    isAdmin: true,
    adminRole: role,
  })
}

// ============================================
// Subscription Plan factories
// ============================================

interface CreatePlanOptions {
  slug?: string
  name?: string
  level?: number
  maxVideoQuality?: string
  canComment?: boolean
  canAccessForum?: boolean
  canDownload?: boolean
  canAccessLimitedEdition?: boolean
  canAccessExclusive?: boolean
  shopDiscount?: number
  isDefault?: boolean
  isFree?: boolean
  monthlyPrice?: number
}

export async function createSubscriptionPlan(options: CreatePlanOptions = {}) {
  return prisma.subscriptionPlan.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.commerce.productName().toLowerCase()),
      name: options.name || faker.commerce.productName(),
      level: options.level ?? 1,
      maxVideoQuality: options.maxVideoQuality || '720p',
      canComment: options.canComment ?? false,
      canAccessForum: options.canAccessForum ?? false,
      canDownload: options.canDownload ?? false,
      canAccessLimitedEdition: options.canAccessLimitedEdition ?? false,
      canAccessExclusive: options.canAccessExclusive ?? false,
      shopDiscount: options.shopDiscount ?? 0,
      isDefault: options.isDefault ?? false,
      isFree: options.isFree ?? true,
      monthlyPrice: options.monthlyPrice ?? 0,
    },
  })
}

export async function createDefaultPlan() {
  return createSubscriptionPlan({
    slug: 'free',
    name: 'Free',
    level: 0,
    maxVideoQuality: '480p',
    isDefault: true,
    isFree: true,
  })
}

export async function createPremiumPlan() {
  return createSubscriptionPlan({
    slug: 'premium',
    name: 'Premium',
    level: 2,
    maxVideoQuality: '1080p',
    canComment: true,
    canAccessForum: true,
    canDownload: true,
    shopDiscount: 10,
    isFree: false,
    monthlyPrice: 19.99,
  })
}

// ============================================
// Video factories
// ============================================

interface CreateVideoOptions {
  slug?: string
  title?: string
  description?: string
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
  minTierPlanId?: string
  isDiamondExclusive?: boolean
  isLimitedEdition?: boolean
  limitedAccessUntil?: Date | null
  thumbnailUrl?: string
  duration?: number
}

export async function createVideo(options: CreateVideoOptions = {}) {
  return prisma.video.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.lorem.words(3).toLowerCase()) + '-' + faker.string.nanoid(6),
      title: options.title || faker.lorem.sentence(),
      description: options.description || faker.lorem.paragraph(),
      status: options.status || 'PUBLISHED',
      minTierPlanId: options.minTierPlanId || null,
      isDiamondExclusive: options.isDiamondExclusive || false,
      isLimitedEdition: options.isLimitedEdition || false,
      limitedAccessUntil: options.limitedAccessUntil || null,
      thumbnailUrl: options.thumbnailUrl || faker.image.url(),
      duration: options.duration || faker.number.int({ min: 60, max: 3600 }),
    },
  })
}

// ============================================
// Performer factories
// ============================================

interface CreatePerformerOptions {
  slug?: string
  name?: string
  bio?: string
  location?: string
  profileImage?: string
  userId?: string
}

export async function createPerformer(options: CreatePerformerOptions = {}) {
  return prisma.performer.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.person.fullName().toLowerCase()) + '-' + faker.string.nanoid(4),
      name: options.name || faker.person.fullName(),
      bio: options.bio || faker.lorem.paragraphs(2),
      location: options.location || null,
      profileImage: options.profileImage || faker.image.avatar(),
      userId: options.userId || null,
    },
  })
}

// ============================================
// Product factories
// ============================================

interface CreateProductOptions {
  slug?: string
  name?: string
  description?: string
  price?: number
  compareAtPrice?: number | null
  stock?: number
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  performerId?: string
  images?: string[]
}

export async function createProduct(options: CreateProductOptions = {}) {
  return prisma.product.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.commerce.productName().toLowerCase()) + '-' + faker.string.nanoid(4),
      name: options.name || faker.commerce.productName(),
      description: options.description || faker.commerce.productDescription(),
      price: options.price ?? parseFloat(faker.commerce.price({ min: 10, max: 100 })),
      compareAtPrice: options.compareAtPrice ?? null,
      stock: options.stock ?? faker.number.int({ min: 0, max: 100 }),
      status: options.status || 'ACTIVE',
      images: options.images || [faker.image.url(), faker.image.url()],
      ...(options.performerId
        ? { performers: { create: { performerId: options.performerId } } }
        : {}),
    },
  })
}

// ============================================
// Category factories
// ============================================

export async function createVideoCategory(options: { slug?: string; name?: string; parentId?: string } = {}) {
  return prisma.videoCategory.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.commerce.department().toLowerCase()) + '-' + faker.string.nanoid(4),
      name: options.name || faker.commerce.department(),
      parentId: options.parentId || null,
    },
  })
}

export async function createShopCategory(options: { slug?: string; name?: string; parentId?: string } = {}) {
  return prisma.shopCategory.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.commerce.department().toLowerCase()) + '-' + faker.string.nanoid(4),
      name: options.name || faker.commerce.department(),
      parentId: options.parentId || null,
    },
  })
}

// ============================================
// Tag factory
// ============================================

export async function createTag(options: { slug?: string; name?: string } = {}) {
  return prisma.tag.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.word.noun().toLowerCase()) + '-' + faker.string.nanoid(4),
      name: options.name || faker.word.noun(),
    },
  })
}

// ============================================
// Blog factories
// ============================================

export async function createBlogCategory(options: { slug?: string; name?: string } = {}) {
  return prisma.blogCategory.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.word.noun().toLowerCase()) + '-' + faker.string.nanoid(4),
      name: options.name || faker.word.noun(),
    },
  })
}

interface CreateBlogPostOptions {
  slug?: string
  title?: string
  content?: string
  authorId: string
  categoryId?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export async function createBlogPost(options: CreateBlogPostOptions) {
  return prisma.blogPost.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.lorem.words(3).toLowerCase()) + '-' + faker.string.nanoid(4),
      title: options.title || faker.lorem.sentence(),
      content: options.content || faker.lorem.paragraphs(3),
      authorId: options.authorId,
      categoryId: options.categoryId || null,
      status: options.status || 'PUBLISHED',
    },
  })
}

// ============================================
// Forum factories
// ============================================

export async function createForumCategory(options: { slug?: string; name?: string; minTierPlanId?: string } = {}) {
  return prisma.forumCategory.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.word.noun().toLowerCase()) + '-' + faker.string.nanoid(4),
      name: options.name || faker.word.noun(),
      minTierPlanId: options.minTierPlanId || null,
    },
  })
}

interface CreateForumPostOptions {
  title?: string
  content?: string
  authorId: string
  categoryId: string
  isPinned?: boolean
  isLocked?: boolean
}

export async function createForumPost(options: CreateForumPostOptions) {
  return prisma.forumPost.create({
    data: {
      title: options.title || faker.lorem.sentence(),
      content: options.content || faker.lorem.paragraphs(2),
      authorId: options.authorId,
      categoryId: options.categoryId,
      isPinned: options.isPinned || false,
      isLocked: options.isLocked || false,
    },
  })
}

interface CreateForumReplyOptions {
  content?: string
  authorId: string
  postId: string
  parentId?: string
}

export async function createForumReply(options: CreateForumReplyOptions) {
  return prisma.forumReply.create({
    data: {
      content: options.content || faker.lorem.paragraph(),
      authorId: options.authorId,
      postId: options.postId,
      parentId: options.parentId || null,
    },
  })
}

// ============================================
// Order factories
// ============================================

interface CreateOrderOptions {
  userId: string
  status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CHARGEBACK'
  subtotal?: number
  total?: number
}

export async function createOrder(options: CreateOrderOptions) {
  const subtotal = options.subtotal ?? parseFloat(faker.commerce.price({ min: 20, max: 200 }))
  const total = options.total ?? subtotal

  return prisma.order.create({
    data: {
      orderNumber: `ORD-${faker.string.nanoid(8).toUpperCase()}`,
      userId: options.userId,
      status: options.status || 'PENDING',
      paymentStatus: options.paymentStatus || 'PENDING',
      subtotal,
      total,
    },
  })
}

interface CreateOrderItemOptions {
  orderId: string
  productId: string
  quantity?: number
  price?: number
}

export async function createOrderItem(options: CreateOrderItemOptions) {
  return prisma.orderItem.create({
    data: {
      orderId: options.orderId,
      productId: options.productId,
      quantity: options.quantity ?? 1,
      price: options.price ?? parseFloat(faker.commerce.price({ min: 10, max: 50 })),
    },
  })
}

// ============================================
// Cart factories
// ============================================

export async function createCart(userId: string) {
  return prisma.cart.create({
    data: {
      userId,
    },
  })
}

export async function addToCart(cartId: string, productId: string, quantity: number = 1) {
  return prisma.cartItem.create({
    data: {
      cartId,
      productId,
      quantity,
    },
  })
}

// ============================================
// PromoCode factory
// ============================================

interface CreatePromoCodeOptions {
  code?: string
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_TRIAL_DAYS'
  discountValue?: number
  applicableTo?: 'SUBSCRIPTION' | 'SHOP' | 'ALL'
  maxUses?: number
  isActive?: boolean
}

export async function createPromoCode(options: CreatePromoCodeOptions = {}) {
  return prisma.promoCode.create({
    data: {
      code: options.code || faker.string.alphanumeric(8).toUpperCase(),
      discountType: options.discountType || 'PERCENTAGE',
      discountValue: options.discountValue ?? 10,
      applicableTo: options.applicableTo || 'ALL',
      maxUses: options.maxUses || null,
      isActive: options.isActive ?? true,
    },
  })
}

// ============================================
// Page factory
// ============================================

interface CreatePageOptions {
  slug?: string
  title?: string
  content?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export async function createPage(options: CreatePageOptions = {}) {
  return prisma.page.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.lorem.words(2).toLowerCase()) + '-' + faker.string.nanoid(4),
      title: options.title || faker.lorem.sentence(),
      content: options.content || faker.lorem.paragraphs(3),
      status: options.status || 'PUBLISHED',
    },
  })
}

// ============================================
// Menu factories
// ============================================

export async function createMenu(options: { slug?: string; name?: string } = {}) {
  return prisma.menu.create({
    data: {
      slug: options.slug || faker.helpers.slugify(faker.word.noun().toLowerCase()) + '-' + faker.string.nanoid(4),
      name: options.name || faker.word.noun(),
    },
  })
}

interface CreateMenuItemOptions {
  menuId: string
  label?: string
  url?: string
  parentId?: string
  order?: number
}

export async function createMenuItem(options: CreateMenuItemOptions) {
  return prisma.menuItem.create({
    data: {
      menuId: options.menuId,
      label: options.label || faker.word.noun(),
      url: options.url || `/${faker.helpers.slugify(faker.word.noun().toLowerCase())}`,
      parentId: options.parentId || null,
      order: options.order ?? 0,
    },
  })
}

// ============================================
// HomeSection factory
// ============================================

interface CreateHomeSectionOptions {
  type?: 'HERO' | 'VIDEO_GRID' | 'ACTRESS_GRID' | 'CTA_BANNER' | 'COUNTDOWN' | 'CATEGORY_FEATURED'
  title?: string
  enabled?: boolean
  order?: number
  config?: Record<string, unknown>
}

export async function createHomeSection(options: CreateHomeSectionOptions = {}) {
  return prisma.homeSection.create({
    data: {
      type: options.type || 'VIDEO_GRID',
      title: options.title || faker.lorem.words(2),
      enabled: options.enabled ?? true,
      order: options.order ?? 0,
      config: (options.config || {}) as any,
    },
  })
}

// ============================================
// Relations helpers
// ============================================

export async function linkVideoToPerformer(videoId: string, performerId: string) {
  return prisma.videoPerformer.create({
    data: { videoId, performerId },
  })
}

export async function linkVideoToCategory(videoId: string, categoryId: string) {
  return prisma.videoToCategory.create({
    data: { videoId, categoryId },
  })
}

export async function linkVideoToTag(videoId: string, tagId: string) {
  return prisma.videoTag.create({
    data: { videoId, tagId },
  })
}

export async function linkProductToCategory(productId: string, categoryId: string) {
  return prisma.productToCategory.create({
    data: { productId, categoryId },
  })
}

export async function linkProductToTag(productId: string, tagId: string) {
  return prisma.productTag.create({
    data: { productId, tagId },
  })
}

// ============================================
// Comment factory
// ============================================

interface CreateCommentOptions {
  content?: string
  authorId: string
  videoId: string
  parentId?: string
}

export async function createComment(options: CreateCommentOptions) {
  return prisma.comment.create({
    data: {
      content: options.content || faker.lorem.paragraph(),
      authorId: options.authorId,
      videoId: options.videoId,
      parentId: options.parentId || null,
    },
  })
}

// ============================================
// Favorite factory
// ============================================

export async function createFavorite(options: { userId: string; videoId?: string; performerId?: string; productId?: string }) {
  return prisma.favorite.create({
    data: {
      userId: options.userId,
      videoId: options.videoId || null,
      performerId: options.performerId || null,
      productId: options.productId || null,
    },
  })
}

// ============================================
// Watch history factory
// ============================================

export async function createWatchHistory(options: { userId: string; videoId: string; watchedSeconds?: number; completed?: boolean }) {
  return prisma.watchHistory.create({
    data: {
      userId: options.userId,
      videoId: options.videoId,
      watchedSeconds: options.watchedSeconds ?? faker.number.int({ min: 0, max: 3600 }),
      completed: options.completed ?? false,
    },
  })
}

// ============================================
// Casting submission factory
// ============================================

interface CreateCastingSubmissionOptions {
  name?: string
  email?: string
  birthDate?: Date
  status?: 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED'
}

export async function createCastingSubmission(options: CreateCastingSubmissionOptions = {}) {
  return prisma.castingSubmission.create({
    data: {
      name: options.name || faker.person.fullName(),
      email: options.email || faker.internet.email(),
      birthDate: options.birthDate || faker.date.birthdate({ min: 18, max: 40, mode: 'age' }),
      status: options.status || 'PENDING',
    },
  })
}

// ============================================
// Site Settings helper
// ============================================

export async function setSiteSetting(key: string, value: unknown) {
  return prisma.siteSettings.upsert({
    where: { key },
    update: { value: value as any },
    create: { key, value: value as any },
  })
}

// ============================================
// Export prisma client
// ============================================

export { prisma }
