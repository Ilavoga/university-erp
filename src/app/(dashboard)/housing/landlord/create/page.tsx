import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CreateListingForm } from "@/components/housing/create-listing-form";

export default async function CreateListingPage() {
  const session = await auth();
  if (!session || session.user.role !== "LANDLORD") redirect("/housing");

  return <CreateListingForm />;
}
