"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PRODUCTS } from "@/lib/data";
import type { Product } from "@/lib/types";

interface ProductComboboxProps {
  value: string | null;
  onSelect: (product: Product) => void;
  disabled?: boolean;
}

export function ProductCombobox({ value, onSelect, disabled }: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = PRODUCTS.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {selected
            ? `${selected.hcpcsCode} — ${selected.name}`
            : "Select product..."}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[460px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or HCPCS code..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {PRODUCTS.filter((p) => p.status === "active").map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.hcpcsCode} ${product.name} ${product.vendor}`}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      <span className="font-mono text-primary">{product.hcpcsCode}</span>
                      {" — "}
                      {product.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {product.vendor} · MSRP{" "}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(product.msrp / 100)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
