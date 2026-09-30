import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/authorization";
import EditDistributorClient from "./EditDistributorClient";

const WRITE_ROLES = ["ADMIN", "FINANCE"];

export default async function EditDistributorPage() {
  const user = await requireUser();

  if (!WRITE_ROLES.includes(user.role)) {
    redirect("/distributors");
  }

  return <EditDistributorClient />;
}
