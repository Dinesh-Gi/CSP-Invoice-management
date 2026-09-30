import { requireUser } from "@/lib/auth/authorization";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  await requireUser();

  return <CustomersClient />;
}