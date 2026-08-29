import type { DefaultSession } from "next-auth";
import type { RoleName } from "@prisma/client";
import type { PermissionKey } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: RoleName;
      permissions: PermissionKey[];
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: RoleName;
    permissions?: PermissionKey[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: RoleName;
    permissions?: PermissionKey[];
    mustChangePassword?: boolean;
  }
}

declare module "next/server" {
  interface NextRequest {
    userId?: string;
    userRole?: RoleName;
    userPermissions?: PermissionKey[];
  }
}
