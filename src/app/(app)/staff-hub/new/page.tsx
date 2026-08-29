import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { PostForm } from "@/components/staffhub/forms";
import { getProjectIdsForUser } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const session = await requireAuth();
  await requirePermission("forum.create", session);
  const projectIds = await getProjectIdsForUser(session.user.id);
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Post" description="Start a discussion or make an announcement." />
      <Card><CardBody><PostForm projects={projects} /></CardBody></Card>
    </div>
  );
}
