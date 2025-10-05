import type { Metadata } from "next";
import { ProtectedShell } from "../../components/ProtectedShell";

export const metadata: Metadata = {
  title: "DormDuty Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
