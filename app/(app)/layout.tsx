import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/me");
  return <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>;
}
