"use client";

import type { OrderStatus } from "@/lib/types";
import { getStatusStyle } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const style = getStatusStyle(status);
  return (
    <Badge variant="outline" className={style.bg}>
      {style.text}
    </Badge>
  );
}
