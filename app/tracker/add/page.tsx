import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/authorization";
import AddTransactionClient from "./AddTransactionClient";

const WRITE_ROLES = ["ADMIN", "FINANCE", "SALES"];

export default async function AddTransactionPage() {
  const user = await requireUser();

  if (!WRITE_ROLES.includes(user.role)) {
    redirect("/tracker");
  }

  return <AddTransactionClient />;
}