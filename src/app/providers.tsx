"use client";

import type { ReactNode } from "react";
import { OrdersProvider } from "@/lib/orders-context";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <OrdersProvider>
      {children}
      <Toaster position="top-right" richColors />
    </OrdersProvider>
  );
}
