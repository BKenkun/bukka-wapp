import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconArrowLeft, IconEye, IconTrash, IconCornerDownRight } from "@tabler/icons-react"
import { PostModeratorActions } from "./post-moderator-actions"
import { revalidatePath } from "next/cache"

interface Props {
  params: Promise<{ id: string }>
}

interface Reply {
  id: string
  content: string
  createdAt: Date
  parentId: string | null
  user: { id: string; name: string | null; email: string }
}

export default async function AdminForumPostPage({ params }: Props) {
  const { id } = await params

  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      ForumCategory: { select: { id: true, name: true, slug: true } },
      ForumReply: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          parentId: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  if (!post) {
    notFound()
  }

  const categories = await prisma.forumCategory.findMany({
    orderBy: { order: "asc" },
  })

  // Capture values before server actions (post is guaranteed non-null after notFound() check)
  const isPinned = post.isPinned
  const isLocked = post.isLocked

  // Server actions
  async function togglePin() {
    "use server"
    await prisma.forumPost.update({
      where: { id },
      data: { isPinned: !isPinned },
    })
    revalidatePath(`/admin/forum/posts/${id}`)
    revalidatePath("/admin/forum")
    revalidatePath("/forum")
  }

  async function toggleLock() {
    "use server"
    await prisma.forumPost.update({
      where: { id },
      data: { isLocked: !isLocked },
    })
    revalidatePath(`/admin/forum/posts/${id}`)
    revalidatePath("/admin/forum")
    revalidatePath(`/foro/${id}`)
  }

  async function updateCategory(formData: FormData) {
    "use server"
    const categoryId = formData.get("categoryId") as string
    await prisma.forumPost.update({
      where: { id },
      data: { categoryId },
    })
    revalidatePath(`/admin/forum/posts/${id}`)
    revalidatePath("/admin/forum")
    revalidatePath("/forum")
  }

  async function deletePost() {
    "use server"
    await prisma.forumPost.delete({
      where: { id },
    })
    redirect("/admin/forum")
  }

  async function deleteReply(formData: FormData) {
    "use server"
    const replyId = formData.get("replyId") as string
    await prisma.$transaction([
      prisma.forumReply.delete({ where: { id: replyId } }),
      prisma.forumPost.update({
        where: { id },
        data: { replyCount: { decrement: 1 } },
      }),
    ])
    revalidatePath(`/admin/forum/posts/${id}`)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/forum">
          <Button variant="ghost" size="icon">
            <IconArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Moderar Tema</h1>
          <p className="text-muted-foreground">Gestiona este tema del foro</p>
        </div>
        <Link href={`/foro/${post.id}`} target="_blank">
          <Button variant="outline">
            <IconEye className="mr-2 size-4" />
            Ver en el foro
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <CardDescription className="mt-2">
                    Por {post.user.name || post.user.email} •{" "}
                    {new Date(post.createdAt).toLocaleString("es-ES")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {post.isPinned && <Badge variant="secondary">Fijado</Badge>}
                  {post.isLocked && <Badge variant="outline">Cerrado</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  className="whitespace-pre-wrap text-foreground"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          <Card>
            <CardHeader>
              <CardTitle>Respuestas ({post.ForumReply.length})</CardTitle>
              <CardDescription>
                Comentarios principales y sus respuestas anidadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {post.ForumReply.length === 0 ? (
                <p className="text-muted-foreground">No hay respuestas.</p>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    // Group replies: top-level and nested
                    const topLevel: Reply[] = []
                    const childrenMap: Record<string, Reply[]> = {}

                    post.ForumReply.forEach((reply) => {
                      if (!reply.parentId) {
                        topLevel.push(reply)
                      } else {
                        if (!childrenMap[reply.parentId]) {
                          childrenMap[reply.parentId] = []
                        }
                        childrenMap[reply.parentId].push(reply)
                      }
                    })

                    const groups = topLevel.map((parent) => ({
                      parent,
                      children: childrenMap[parent.id] || [],
                    }))

                    return groups.map((group) => (
                      <div key={group.parent.id} className="border rounded-lg overflow-hidden">
                        {/* Parent comment */}
                        <div className="p-4 bg-background">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Nuevo</Badge>
                              <span className="font-medium">
                                {group.parent.user.name || group.parent.user.email}
                              </span>
                              <span className="text-muted-foreground text-sm">
                                {new Date(group.parent.createdAt).toLocaleString("es-ES")}
                              </span>
                            </div>
                            <form action={deleteReply}>
                              <input type="hidden" name="replyId" value={group.parent.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                              >
                                <IconTrash className="size-4" />
                              </Button>
                            </form>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{group.parent.content}</p>
                        </div>

                        {/* Nested replies */}
                        {group.children.length > 0 && (
                          <div className="border-t bg-muted/30">
                            {group.children.map((child) => (
                              <div key={child.id} className="p-4 pl-8 border-b last:border-b-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <IconCornerDownRight className="size-4 text-muted-foreground" />
                                    <Badge variant="secondary" className="text-xs">Respuesta</Badge>
                                    <span className="font-medium">
                                      {child.user.name || child.user.email}
                                    </span>
                                    <span className="text-muted-foreground text-sm">
                                      {new Date(child.createdAt).toLocaleString("es-ES")}
                                    </span>
                                  </div>
                                  <form action={deleteReply}>
                                    <input type="hidden" name="replyId" value={child.id} />
                                    <Button
                                      type="submit"
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <IconTrash className="size-4" />
                                    </Button>
                                  </form>
                                </div>
                                <p className="text-sm whitespace-pre-wrap ml-6">{child.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          <PostModeratorActions
            postId={post.id}
            isPinned={post.isPinned}
            isLocked={post.isLocked}
            categoryId={post.categoryId}
            categories={categories}
            togglePin={togglePin}
            toggleLock={toggleLock}
            updateCategory={updateCategory}
            deletePost={deletePost}
          />

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vistas</span>
                <span className="font-medium">{post.viewCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Likes</span>
                <span className="font-medium">{post.likeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Respuestas</span>
                <span className="font-medium">{post.replyCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última respuesta</span>
                <span className="font-medium text-sm">
                  {post.lastReplyAt
                    ? new Date(post.lastReplyAt).toLocaleDateString("es-ES")
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Autor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{post.user.name || "Sin nombre"}</p>
              <p className="text-sm text-muted-foreground">{post.user.email}</p>
              <Link href={`/admin/users/${post.user.id}`}>
                <Button variant="outline" size="sm" className="mt-2">
                  Ver perfil de usuario
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
