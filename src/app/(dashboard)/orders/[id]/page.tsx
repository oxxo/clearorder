"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ROUTES } from "@/lib/utils";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <PageHeader
        title={`Order ${id}`}
        breadcrumbs={[
          { label: "Orders", href: ROUTES.dashboard },
          { label: id },
        ]}
      />
      <p className="text-muted-foreground">Order detail coming next...</p>
    </div>
  );
}
