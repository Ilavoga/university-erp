import { auth } from "@/auth";
import TransportClient from "@/components/transport/transport-client";

export default async function TransportPage() {
  const session = await auth();
  const userId = session?.user?.id;

  return <TransportClient userId={userId} />;
}
