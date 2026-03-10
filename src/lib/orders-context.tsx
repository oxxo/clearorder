"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Order } from "./types";
import { SAMPLE_ORDERS } from "./data";
import { syncOrderCounter } from "./utils";

const STORAGE_KEY = "clearorder_orders";

type OrdersAction =
  | { type: "ADD_ORDER"; order: Order }
  | { type: "UPDATE_ORDER"; order: Order }
  | { type: "HYDRATE"; orders: Order[] };

function ordersReducer(state: Order[], action: OrdersAction): Order[] {
  switch (action.type) {
    case "ADD_ORDER":
      return [action.order, ...state];
    case "UPDATE_ORDER":
      return state.map((o) =>
        o.id === action.order.id ? action.order : o
      );
    case "HYDRATE":
      return action.orders;
    default:
      return state;
  }
}

interface OrdersContextValue {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  getOrderById: (id: string) => Order | undefined;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  // Always init with SAMPLE_ORDERS for SSR/hydration consistency
  const [orders, dispatch] = useReducer(ordersReducer, SAMPLE_ORDERS);
  const hydrated = useRef(false);

  // Hydrate from localStorage AFTER mount (avoids React 19 hydration mismatch)
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Order[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "HYDRATE", orders: parsed });
          syncOrderCounter(parsed);
          return;
        }
      }
    } catch {
      // Invalid data — fall through to defaults
    }

    // No valid stored data — sync counter with sample orders
    syncOrderCounter(SAMPLE_ORDERS);
  }, []);

  // Persist to localStorage on every change (skip initial render)
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // Storage full or unavailable — silent fail
    }
  }, [orders]);

  const addOrder = (order: Order) =>
    dispatch({ type: "ADD_ORDER", order });

  const updateOrder = (order: Order) =>
    dispatch({ type: "UPDATE_ORDER", order });

  const getOrderById = (id: string) =>
    orders.find((o) => o.id === id);

  return (
    <OrdersContext.Provider
      value={{ orders, addOrder, updateOrder, getOrderById }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
