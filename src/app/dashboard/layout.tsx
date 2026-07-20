import { ProtectedLayout } from "@/components/auth/protected-layout";
import type { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
