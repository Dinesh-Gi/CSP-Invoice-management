import { requireUser } from "@/lib/auth/authorization";
import DistributorsClient from "./DistributorsClient";

export default async function DistributorsPage() {
  await requireUser();

  return <DistributorsClient />;
}
