import { SidebarNav } from "@/components/sidebar-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SidebarNav />
      <main className="ml-60 p-8">{children}</main>
    </div>
  );
}
