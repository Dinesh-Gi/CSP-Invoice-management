import { requireUser } from "@/lib/auth/authorization";
import InvoicesClient from "./InvoicesClient";

export default async function InvoicesPage() {
  await requireUser();

  return <InvoicesClient />;
}
