import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function RootPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  switch (user.role) {
    case "CUSTOMER":
      redirect("/customer");
    case "CRM":
      redirect("/crm");
    case "INSTALLATION":
      redirect("/installation");
    case "ACTIVATION":
      redirect("/activation");
    default:
      redirect("/login");
  }
}
