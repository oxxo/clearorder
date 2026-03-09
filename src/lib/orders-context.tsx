"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { Order } from "./types";
import { SAMPLE_ORDERS } from "./data";

type OrdersAction =
  | { type: "ADD_ORDER"; order: Order }
  | { type: "UPDATE_ORDER"; order: Order };

function ordersReducer(state: Order[], action: OrdersAction): Order[] {
  switch (action.type) {
    case "ADD_ORDER":
      return [action.order, ...state];
    case "UPDATE_ORDER":
      return state.map((o) =>
        o.id === action.order.id ? action.order : o
      );
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
  const [orders, dispatch] = useReducer(ordersReducer, SAMPLE_ORDERS);

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
