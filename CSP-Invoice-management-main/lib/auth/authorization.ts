import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, type SessionUser } from "./session";

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}

export function hasRole(
  user: SessionUser,
  allowedRoles: string[]
): boolean {
  return allowedRoles.includes(user.role);
}