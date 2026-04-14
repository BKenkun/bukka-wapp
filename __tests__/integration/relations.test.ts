import { describe, it, expect, beforeEach } from 'vitest'
import {
  prisma,
  cleanupDatabase,
  createUser,
  createVideo,
  createPerformer,
  createProduct,
  createVideoCategory,
  createShopCategory,
  createTag,
  createSubscriptionPlan,
  createDefaultPlan,
  createPremiumPlan,
  createForumCategory,
  createForumPost,
  createForumReply,
  createOrder,
  createOrderItem,
  createComment,
  createFavorite,
  createWatchHistory,
  linkVideoToPerformer,
  linkVideoToCategory,
  linkVideoToTag,
  linkProductToCategory,
  linkProductToTag,
} from './helpers'

describe('Entity Relationships', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  describe('Video ↔ Performer', () => {
    it('should link video to performer', async () => {
      const video = await createVideo({ title: 'Test Video' })
      const performer = await createPerformer({ name: 'Test Performer' })

      await linkVideoToPerformer(video.id, performer.id)

      // Verify from video side
      const videoWithPerformer = await prisma.video.findUnique({
        where: { id: video.id },
        include: { performers: { include: { performer: true } } },
      })

      expect(videoWithPerformer?.performers).toHaveLength(1)
      expect(videoWithPerformer?.performers[0].performer.name).toBe('Test Performer')

      // Verify from performer side
      const performerVideos = await prisma.videoPerformer.findMany({
        where: { performerId: performer.id },
        include: { video: true },
      })

      expect(performerVideos).toHaveLength(1)
      expect(performerVideos[0].video.title).toBe('Test Video')
    })

    it('should allow multiple performers per video', async () => {
      const video = await createVideo({ title: 'Multi Performer Video' })
      const performer1 = await createPerformer({ name: 'Performer 1' })
      const performer2 = await createPerformer({ name: 'Performer 2' })

      await linkVideoToPerformer(video.id, performer1.id)
      await linkVideoToPerformer(video.id, performer2.id)

      const videoWithPerformers = await prisma.video.findUnique({
        where: { id: video.id },
        include: { performers: { include: { performer: true } } },
      })

      expect(videoWithPerformers?.performers).toHaveLength(2)
    })

    it('should allow performer in multiple videos', async () => {
      const video1 = await createVideo({ title: 'Video 1' })
      const video2 = await createVideo({ title: 'Video 2' })
      const performer = await createPerformer({ name: 'Popular Performer' })

      await linkVideoToPerformer(video1.id, performer.id)
      await linkVideoToPerformer(video2.id, performer.id)

      const performerVideos = await prisma.videoPerformer.findMany({
        where: { performerId: performer.id },
      })

      expect(performerVideos).toHaveLength(2)
    })
  })

  describe('Video ↔ Category', () => {
    it('should link video to category', async () => {
      const video = await createVideo({ title: 'Categorized Video' })
      const category = await createVideoCategory({ name: 'Test Category' })

      await linkVideoToCategory(video.id, category.id)

      const videoWithCategory = await prisma.video.findUnique({
        where: { id: video.id },
        include: { categories: { include: { category: true } } },
      })

      expect(videoWithCategory?.categories).toHaveLength(1)
      expect(videoWithCategory?.categories[0].category.name).toBe('Test Category')
    })

    it('should allow multiple categories per video', async () => {
      const video = await createVideo({ title: 'Multi Category Video' })
      const category1 = await createVideoCategory({ name: 'Category 1' })
      const category2 = await createVideoCategory({ name: 'Category 2' })

      await linkVideoToCategory(video.id, category1.id)
      await linkVideoToCategory(video.id, category2.id)

      const videoWithCategories = await prisma.video.findUnique({
        where: { id: video.id },
        include: { categories: true },
      })

      expect(videoWithCategories?.categories).toHaveLength(2)
    })
  })

  describe('Video ↔ Tag', () => {
    it('should link video to tag', async () => {
      const video = await createVideo({ title: 'Tagged Video' })
      const tag = await createTag({ name: 'Test Tag' })

      await linkVideoToTag(video.id, tag.id)

      const videoWithTag = await prisma.video.findUnique({
        where: { id: video.id },
        include: { tags: { include: { tag: true } } },
      })

      expect(videoWithTag?.tags).toHaveLength(1)
      expect(videoWithTag?.tags[0].tag.name).toBe('Test Tag')
    })

    it('should share tags across videos', async () => {
      const video1 = await createVideo({ title: 'Video 1' })
      const video2 = await createVideo({ title: 'Video 2' })
      const tag = await createTag({ name: 'Shared Tag' })

      await linkVideoToTag(video1.id, tag.id)
      await linkVideoToTag(video2.id, tag.id)

      const taggedVideos = await prisma.videoTag.findMany({
        where: { tagId: tag.id },
      })

      expect(taggedVideos).toHaveLength(2)
    })
  })

  describe('Product ↔ Category', () => {
    it('should link product to shop category', async () => {
      const product = await createProduct({ name: 'Categorized Product' })
      const category = await createShopCategory({ name: 'Test Shop Category' })

      await linkProductToCategory(product.id, category.id)

      const productWithCategory = await prisma.product.findUnique({
        where: { id: product.id },
        include: { ProductToCategory: { include: { ShopCategory: true } } },
      })

      expect(productWithCategory?.ProductToCategory).toHaveLength(1)
      expect(productWithCategory?.ProductToCategory[0].ShopCategory.name).toBe('Test Shop Category')
    })
  })

  describe('Product ↔ Performer', () => {
    it('should link product to performer', async () => {
      const performer = await createPerformer({ name: 'Merch Performer' })
      const product = await createProduct({ name: 'Performer Product', performerId: performer.id })

      const productWithPerformer = await prisma.product.findUnique({
        where: { id: product.id },
        include: { performers: { include: { performer: true } } },
      })

      expect(productWithPerformer?.performers?.[0]?.performer?.name).toBe('Merch Performer')

      // Verify from performer side
      const performerWithProducts = await prisma.performer.findUnique({
        where: { id: performer.id },
        include: { products: true },
      })

      expect(performerWithProducts?.products).toHaveLength(1)
    })
  })

  describe('User ↔ Subscription', () => {
    it('should link user to subscription plan', async () => {
      const plan = await createPremiumPlan()
      const user = await createUser({
        subscriptionPlanId: plan.id,
        subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      })

      expect(user.SubscriptionPlan?.name).toBe('Premium')
      expect(user.SubscriptionPlan?.level).toBe(2)
    })

    it('should track subscription history', async () => {
      const user = await createUser()
      const plan = await createSubscriptionPlan()

      await prisma.subscriptionHistory.create({
        data: {
          userId: user.id,
          planId: plan.id,
          startDate: new Date(),
          amount: 19.99,
          paymentGateway: 'stripe',
          transactionId: 'txn_123',
        },
      })

      const history = await prisma.subscriptionHistory.findMany({
        where: { userId: user.id },
        include: { SubscriptionPlan: true },
      })

      expect(history).toHaveLength(1)
      expect(history[0].SubscriptionPlan.id).toBe(plan.id)
    })
  })

  describe('User ↔ Favorites', () => {
    it('should track video favorites', async () => {
      const user = await createUser()
      const video = await createVideo()

      await createFavorite({ userId: user.id, videoId: video.id })

      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id, videoId: { not: null } },
        include: { Video: true },
      })

      expect(favorites).toHaveLength(1)
      expect(favorites[0].Video?.id).toBe(video.id)
    })

    it('should track performer favorites', async () => {
      const user = await createUser()
      const performer = await createPerformer()

      await createFavorite({ userId: user.id, performerId: performer.id })

      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id, performerId: { not: null } },
        include: { Performer: true },
      })

      expect(favorites).toHaveLength(1)
      expect(favorites[0].Performer?.id).toBe(performer.id)
    })

    it('should track product favorites', async () => {
      const user = await createUser()
      const product = await createProduct()

      await createFavorite({ userId: user.id, productId: product.id })

      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id, productId: { not: null } },
        include: { Product: true },
      })

      expect(favorites).toHaveLength(1)
      expect(favorites[0].Product?.id).toBe(product.id)
    })

    it('should enforce unique user-video favorite', async () => {
      const user = await createUser()
      const video = await createVideo()

      await createFavorite({ userId: user.id, videoId: video.id })

      // Try to create duplicate
      await expect(createFavorite({ userId: user.id, videoId: video.id })).rejects.toThrow()
    })
  })

  describe('Order ↔ Product', () => {
    it('should create order with items', async () => {
      const user = await createUser()
      const product1 = await createProduct({ name: 'Product 1', price: 29.99 })
      const product2 = await createProduct({ name: 'Product 2', price: 19.99 })

      const order = await createOrder({ userId: user.id, subtotal: 49.98, total: 49.98 })
      await createOrderItem({ orderId: order.id, productId: product1.id, price: 29.99 })
      await createOrderItem({ orderId: order.id, productId: product2.id, price: 19.99 })

      const orderWithItems = await prisma.order.findUnique({
        where: { id: order.id },
        include: { OrderItem: { include: { product: true } } },
      })

      expect(orderWithItems?.OrderItem).toHaveLength(2)
      expect(orderWithItems?.OrderItem.map((i) => i.product.name)).toContain('Product 1')
      expect(orderWithItems?.OrderItem.map((i) => i.product.name)).toContain('Product 2')
    })
  })

  describe('Forum: Category → Post → Reply', () => {
    it('should create forum hierarchy', async () => {
      const user = await createUser()
      const category = await createForumCategory({ name: 'General' })
      const post = await createForumPost({
        title: 'Test Post',
        content: 'Post content',
        authorId: user.id,
        categoryId: category.id,
      })
      const reply = await createForumReply({
        content: 'Reply content',
        authorId: user.id,
        postId: post.id,
      })

      // Verify hierarchy
      const categoryWithPosts = await prisma.forumCategory.findUnique({
        where: { id: category.id },
        include: { ForumPost: true },
      })
      expect(categoryWithPosts?.ForumPost).toHaveLength(1)

      const postWithReplies = await prisma.forumPost.findUnique({
        where: { id: post.id },
        include: { ForumReply: true },
      })
      expect(postWithReplies?.ForumReply).toHaveLength(1)
    })

    it('should support nested replies', async () => {
      const user = await createUser()
      const category = await createForumCategory()
      const post = await createForumPost({
        title: 'Test Post',
        content: 'Content',
        authorId: user.id,
        categoryId: category.id,
      })

      const parentReply = await createForumReply({
        content: 'Parent reply',
        authorId: user.id,
        postId: post.id,
      })

      const childReply = await createForumReply({
        content: 'Child reply',
        authorId: user.id,
        postId: post.id,
        parentId: parentReply.id,
      })

      const parentWithChildren = await prisma.forumReply.findUnique({
        where: { id: parentReply.id },
        include: { other_ForumReply: true },
      })

      expect(parentWithChildren?.other_ForumReply).toHaveLength(1)
      expect(parentWithChildren?.other_ForumReply[0].id).toBe(childReply.id)
    })
  })

  describe('Video Comments', () => {
    it('should link comments to video and user', async () => {
      const user = await createUser()
      const video = await createVideo()

      const comment = await createComment({
        content: 'Great video!',
        authorId: user.id,
        videoId: video.id,
      })

      const commentWithRelations = await prisma.comment.findUnique({
        where: { id: comment.id },
        include: { user: true, video: true },
      })

      expect(commentWithRelations?.user.id).toBe(user.id)
      expect(commentWithRelations?.video.id).toBe(video.id)
    })

    it('should support nested comments', async () => {
      const user = await createUser()
      const video = await createVideo()

      const parentComment = await createComment({
        content: 'Parent comment',
        authorId: user.id,
        videoId: video.id,
      })

      const childComment = await createComment({
        content: 'Reply to parent',
        authorId: user.id,
        videoId: video.id,
        parentId: parentComment.id,
      })

      const parentWithReplies = await prisma.comment.findUnique({
        where: { id: parentComment.id },
        include: { other_Comment: true },
      })

      expect(parentWithReplies?.other_Comment).toHaveLength(1)
      expect(parentWithReplies?.other_Comment[0].id).toBe(childComment.id)
    })
  })

  describe('Watch History', () => {
    it('should track user watch history', async () => {
      const user = await createUser()
      const video1 = await createVideo({ title: 'Video 1' })
      const video2 = await createVideo({ title: 'Video 2' })

      await createWatchHistory({ userId: user.id, videoId: video1.id, watchedSeconds: 120 })
      await createWatchHistory({ userId: user.id, videoId: video2.id, watchedSeconds: 300, completed: true })

      const history = await prisma.watchHistory.findMany({
        where: { userId: user.id },
        include: { video: true },
        orderBy: { lastWatchedAt: 'desc' },
      })

      expect(history).toHaveLength(2)
      expect(history.find((h) => h.video.title === 'Video 2')?.completed).toBe(true)
    })

    it('should enforce unique user-video combination', async () => {
      const user = await createUser()
      const video = await createVideo()

      await createWatchHistory({ userId: user.id, videoId: video.id })

      await expect(createWatchHistory({ userId: user.id, videoId: video.id })).rejects.toThrow()
    })
  })

  describe('Cascade Deletes', () => {
    it('should cascade delete video performers when video is deleted', async () => {
      const video = await createVideo()
      const performer = await createPerformer()
      await linkVideoToPerformer(video.id, performer.id)

      // Verify link exists
      const linksBefore = await prisma.videoPerformer.findMany({
        where: { videoId: video.id },
      })
      expect(linksBefore).toHaveLength(1)

      // Delete video
      await prisma.video.delete({ where: { id: video.id } })

      // Verify link is deleted
      const linksAfter = await prisma.videoPerformer.findMany({
        where: { videoId: video.id },
      })
      expect(linksAfter).toHaveLength(0)

      // Performer should still exist
      const performerExists = await prisma.performer.findUnique({
        where: { id: performer.id },
      })
      expect(performerExists).toBeDefined()
    })

    it('should cascade delete comments when video is deleted', async () => {
      const user = await createUser()
      const video = await createVideo()
      await createComment({ content: 'Test comment', authorId: user.id, videoId: video.id })

      const commentsBefore = await prisma.comment.findMany({
        where: { videoId: video.id },
      })
      expect(commentsBefore).toHaveLength(1)

      await prisma.video.delete({ where: { id: video.id } })

      const commentsAfter = await prisma.comment.findMany({
        where: { videoId: video.id },
      })
      expect(commentsAfter).toHaveLength(0)
    })

    it('should cascade delete favorites when user is deleted', async () => {
      const user = await createUser()
      const video = await createVideo()
      await createFavorite({ userId: user.id, videoId: video.id })

      const favoritesBefore = await prisma.favorite.findMany({
        where: { userId: user.id },
      })
      expect(favoritesBefore).toHaveLength(1)

      await prisma.user.delete({ where: { id: user.id } })

      const favoritesAfter = await prisma.favorite.findMany({
        where: { userId: user.id },
      })
      expect(favoritesAfter).toHaveLength(0)
    })
  })
})
