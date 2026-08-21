import { useCallback, useEffect, useState } from "react";
import { type Expense } from "@/lib/expenses";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "sonner";

export type ExpenseInput = Omit<Expense, "id" | "createdAt" | "userId">;

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "users", currentUser.uid, "expenses")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const loaded: Expense[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            userId: data.userId,
            amount: data.amount,
            date: data.date,
            category: data.category,
            description: data.description,
            paymentMethod: data.paymentMethod,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        });

        // Sort by createdAt descending
        loaded.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

        setExpenses(loaded);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        toast.error("Failed to sync expenses in real-time.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      if (!currentUser) {
        throw new Error("You must be logged in to add an expense.");
      }

      const newRef = doc(collection(db, "users", currentUser.uid, "expenses"));
      await setDoc(newRef, {
        ...input,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
    },
    [currentUser]
  );

  const updateExpense = useCallback(
    async (id: string, input: ExpenseInput) => {
      if (!currentUser) {
        throw new Error("You must be logged in to update an expense.");
      }
      
      const expenseRef = doc(db, "users", currentUser.uid, "expenses", id);
      await updateDoc(expenseRef, {
        ...input,
      });
    },
    [currentUser]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!currentUser) {
        throw new Error("You must be logged in to delete an expense.");
      }
      
      const expenseRef = doc(db, "users", currentUser.uid, "expenses", id);
      await deleteDoc(expenseRef);
    },
    [currentUser]
  );

  return { expenses, isLoading, addExpense, updateExpense, deleteExpense };
}
