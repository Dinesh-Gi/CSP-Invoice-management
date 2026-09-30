import { requireAdmin } from "@/lib/auth/authorization";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  await requireAdmin();

  return <UsersClient />;
}