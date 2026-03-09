"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { PRODUCTS } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types";

const CATEGORIES: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "compression_stocking", label: "Compression Stockings" },
  { value: "compression_bandage", label: "Compression Bandages" },
  { value: "pneumatic_device", label: "Pneumatic Devices" },
  { value: "breast_prosthesis", label: "Breast Prostheses" },
  { value: "mastectomy_bra", label: "Mastectomy Bras" },
];

function formatCategory(cat: ProductCategory): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filtered = PRODUCTS.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.hcpcsCode.toLowerCase().includes(search.toLowerCase()) ||
      p.vendor.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <PageHeader
        title="Products"
        description="Product catalog with HCPCS codes and vendor information"
      />

      <Card>
        <div className="p-6 pb-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, HCPCS, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={(val) => val && setCategory(val)}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
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
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">MSRP</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm text-primary font-medium">
                    {product.hcpcsCode}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCategory(product.category)}
                  </TableCell>
                  <TableCell>{product.vendor}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(product.msrp)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        product.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }
                    >
                      {product.status === "active" ? "Active" : "Discontinued"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No products found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4 text-xs text-muted-foreground">
            Showing {filtered.length} of {PRODUCTS.length} products
          </div>
        </div>
      </Card>
    </div>
  );
}
