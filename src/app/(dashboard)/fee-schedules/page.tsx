"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { FEE_SCHEDULE, PAYERS, PRODUCTS } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function FeeSchedulesPage() {
  const [selectedPayer, setSelectedPayer] = useState<string>("all");

  const insurancePayers = PAYERS.filter((p) => p.type !== "self_pay");

  const filtered =
    selectedPayer === "all"
      ? FEE_SCHEDULE
      : FEE_SCHEDULE.filter((e) => e.payerId === selectedPayer);

  const getProductName = (hcpcsCode: string) =>
    PRODUCTS.find((p) => p.hcpcsCode === hcpcsCode)?.name ?? hcpcsCode;

  const getPayerName = (payerId: string) =>
    PAYERS.find((p) => p.id === payerId)?.name ?? payerId;

  return (
    <div>
      <PageHeader
        title="Fee Schedules"
        description="Payer rate schedules by HCPCS code"
      />

      <Card>
        <div className="p-6 pb-4 flex items-center gap-4">
          <Select
            value={selectedPayer}
            onValueChange={(val) => val && setSelectedPayer(val)}
          >
            <SelectTrigger className="w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payers</SelectItem>
              {insurancePayers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HCPCS Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead className="text-right">Allowed Amount</TableHead>
                <TableHead className="text-right">Effective Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm text-primary font-medium">
                    {entry.hcpcsCode}
                  </TableCell>
                  <TableCell>{getProductName(entry.hcpcsCode)}</TableCell>
                  <TableCell>{getPayerName(entry.payerId)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(entry.allowedAmount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(entry.effectiveDate)}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No fee schedule entries found{selectedPayer !== "all" ? ` for ${getPayerName(selectedPayer)}` : ""}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4 text-xs text-muted-foreground">
            Showing {filtered.length} of {FEE_SCHEDULE.length} entries
            {selectedPayer !== "all" && ` for ${getPayerName(selectedPayer)}`}
          </div>
        </div>
      </Card>
    </div>
  );
}
