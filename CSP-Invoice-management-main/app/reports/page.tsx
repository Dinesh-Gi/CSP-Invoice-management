import { requireUser } from "@/lib/auth/authorization";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  await requireUser();

  return <ReportsClient />;
}
