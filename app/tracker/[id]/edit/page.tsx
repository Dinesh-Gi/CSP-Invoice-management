import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/authorization";
import EditTransactionClient from "./EditTransactionClient";

const WRITE_ROLES = ["ADMIN", "FINANCE", "SALES"];

export default async function EditTransactionPage() {
  const user = await requireUser();

  if (!WRITE_ROLES.includes(user.role)) {
    redirect("/tracker");
  }

  return <EditTransactionClient />;
}