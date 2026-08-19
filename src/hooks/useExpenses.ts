import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  createId,
  loadExpenses,
  saveExpenses,
  type Expense,
} from "@/lib/expenses";

type Listener = () => void;

let state: Expense[] = [];
let hydrated = false;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(next: Expense[]) {
  state = next;
  saveExpenses(next);
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot(): Expense[] {
  return [];
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt">;

export function useExpenses() {
  const expenses = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    state = loadExpenses();
    emit();
  }, []);

  const addExpense = useCallback((input: ExpenseInput) => {
    setState([
      { ...input, id: createId(), createdAt: new Date().toISOString() },
      ...state,
    ]);
  }, []);

  const updateExpense = useCallback((id: string, input: ExpenseInput) => {
    setState(state.map((e) => (e.id === id ? { ...e, ...input } : e)));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setState(state.filter((e) => e.id !== id));
  }, []);

  return { expenses, addExpense, updateExpense, deleteExpense };
}
