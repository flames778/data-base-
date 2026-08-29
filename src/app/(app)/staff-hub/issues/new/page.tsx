import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { IssueForm } from "@/components/staffhub/forms";
import { getProjectIdsForUser } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function NewIssuePage() {
  const session = await requireAuth();
  await requirePermission("issues.create", session);
  const projectIds = await getProjectIdsForUser(session.user.id);
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Report an Issue" description="Submit a challenge, technical issue or request." />
      <Card><CardBody><IssueForm projects={projects} /></CardBody></Card>
    </div>
  );
}
