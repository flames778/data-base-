import { requireAuth } from "@/lib/authz";
import { redirect } from "next/navigation";

const ROLE_DASHBOARD: Record<string, string> = {
  CEO: "/dashboard/ceo",
  ADMIN: "/dashboard/admin",
  PROJECT_LEAD: "/dashboard/project-lead",
  TEAM_MEMBER: "/dashboard/employee",
  FIELD_STAFF: "/dashboard/employee",
  INTERN: "/dashboard/employee",
};

export default async function DashboardIndex() {
  const session = await requireAuth();
  const role = session.user.role;
  const target = ROLE_DASHBOARD[role] ?? "/dashboard/employee";
  redirect(target);
}
