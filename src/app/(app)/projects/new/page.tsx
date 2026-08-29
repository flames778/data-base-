import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const session = await requireAuth();
  await requirePermission("projects.manage", session);

  const [users, teams] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Project" description="Create a new project." />
      <Card>
        <CardBody>
          <ProjectForm users={users} teams={teams} />
        </CardBody>
      </Card>
    </div>
  );
}
