import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsSidebar } from "@/components/SettingsSidebar";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/settings/account");
  }

  return (
    <div className="min-h-dvh bg-background pt-14">
      <div className="max-w-4xl mx-auto flex min-h-[calc(100dvh-3.5rem)]">
        <SettingsSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
