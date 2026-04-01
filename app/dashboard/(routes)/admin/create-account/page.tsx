import { redirect } from "next/navigation";

export default function CreateAccountRedirectPage() {
  redirect("/dashboard/admin/management?tab=create-account");
}
