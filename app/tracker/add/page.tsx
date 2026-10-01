import { requireUser } from "@/lib/auth/authorization";
import AddTransactionClient from "./AddTransactionClient";

export default async function AddTransactionPage() {
  await requireUser();

  return <AddTransactionClient />;
}