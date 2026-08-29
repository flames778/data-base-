import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { ClaimForm } from "@/components/claims/claim-form";
import { getProjectIdsForUser } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  const session = await requireAuth();
  await requirePermission("claims.create", session);
  const projectIds = await getProjectIdsForUser(session.user.id);
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Claim / Request" description="Submit a claim or resource request." />
      <Card><CardBody><ClaimForm projects={projects} /></CardBody></Card>
    </div>
  );
}
