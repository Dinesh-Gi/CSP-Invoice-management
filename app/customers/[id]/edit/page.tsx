import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/authorization";
import EditCustomerClient from "./EditCustomerClient";

const WRITE_ROLES = ["ADMIN", "FINANCE", "SALES"];

export default async function EditCustomerPage() {
  const user = await requireUser();

  if (!WRITE_ROLES.includes(user.role)) {
    redirect("/customers");
  }

  return <EditCustomerClient />;
}