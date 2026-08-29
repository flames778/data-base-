import { requireAuth, requirePermission, NotFoundError } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { CommentSection } from "@/components/comments/comment-section";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  await requirePermission("forum.comment", session);

  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      project: { select: { name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!post) throw new NotFoundError();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={post.title}
        description={`by ${post.author.name} · ${new Date(post.createdAt).toLocaleString()}`}
        actions={<LinkButton href="/staff-hub" variant="ghost">Back</LinkButton>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="blue">{post.category.replace(/_/g, " ")}</Badge>
        {post.isAnnouncement && <Badge tone="purple">Announcement</Badge>}
        {post.project && <Badge tone="slate">{post.project.name}</Badge>}
      </div>

      <Card className="mb-6">
        <CardBody>
          <p className="whitespace-pre-wrap text-sm">{post.content}</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CommentSection
            target={{ postId: post.id }}
            comments={post.comments.map((c) => ({
              id: c.id,
              content: c.content,
              createdAt: c.createdAt.toISOString(),
              author: { name: c.author.name },
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
