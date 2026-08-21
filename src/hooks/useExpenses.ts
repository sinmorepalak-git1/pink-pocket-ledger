import { useCallback, useEffect, useState } from "react";
import { type Expense } from "@/lib/expenses";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
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
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const fetchExpenses = useCallback(async () => {
    if (!currentUser) {
      setExpenses([]);
      return;
    }

    try {
      setIsLoading(true);
      const q = query(
        collection(db, "users", currentUser.uid, "expenses")
      );
      const querySnapshot = await getDocs(q);
      const loaded: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loaded.push({
          id: doc.id,
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
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load expenses.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

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

      await fetchExpenses();
    },
    [currentUser, fetchExpenses]
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
      await fetchExpenses();
    },
    [currentUser, fetchExpenses]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!currentUser) {
        throw new Error("You must be logged in to delete an expense.");
      }
      
      const expenseRef = doc(db, "users", currentUser.uid, "expenses", id);
      await deleteDoc(expenseRef);
      await fetchExpenses();
    },
    [currentUser, fetchExpenses]
  );

  return { expenses, isLoading, addExpense, updateExpense, deleteExpense };
}
