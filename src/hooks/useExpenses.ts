import { useCallback, useEffect, useState } from "react";
import { type Transaction, type Wallet } from "@/lib/expenses";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { toast } from "sonner";

export type TransactionInput = Omit<Transaction, "id" | "createdAt" | "userId">;

export function useExpenses() {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<Wallet>({ cashBalance: 0, onlineBalance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setExpenses([]);
      setWallet({ cashBalance: 0, onlineBalance: 0 });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Listen to Wallet balance
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubWallet = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWallet({
          cashBalance: data.cashBalance || 0,
          onlineBalance: data.onlineBalance || 0,
        });
      } else {
        setWallet({ cashBalance: 0, onlineBalance: 0 });
      }
    });

    // Listen to Transactions
    const q = query(collection(db, "users", currentUser.uid, "transactions"));
    const unsubTransactions = onSnapshot(
      q,
      (querySnapshot) => {
        const loaded: Transaction[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            userId: data.userId,
            type: data.type || "expense",
            amount: data.amount,
            date: data.date,
            category: data.category,
            description: data.description,
            account: data.account,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        });

        loaded.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        setExpenses(loaded);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        toast.error("Failed to sync transactions in real-time.");
        setIsLoading(false);
      }
    );

    return () => {
      unsubWallet();
      unsubTransactions();
    };
  }, [currentUser]);

  // Helper to adjust balance inside a transaction
  const getNewBalances = (
    currentCash: number,
    currentOnline: number,
    amount: number,
    account: "cash" | "online",
    action: "add_expense" | "remove_expense" | "add_income" | "remove_income"
  ) => {
    let cash = currentCash;
    let online = currentOnline;

    const isCash = account === "cash";
    
    if (action === "add_expense") {
      if (isCash) cash -= amount;
      else online -= amount;
    } else if (action === "remove_expense") {
      if (isCash) cash += amount;
      else online += amount;
    } else if (action === "add_income") {
      if (isCash) cash += amount;
      else online += amount;
    } else if (action === "remove_income") {
      if (isCash) cash -= amount;
      else online -= amount;
    }

    return { cash, online };
  };

  const addExpense = useCallback(
    async (input: TransactionInput) => {
      if (!currentUser) throw new Error("You must be logged in to add a transaction.");
      const userRef = doc(db, "users", currentUser.uid);
      const newTxRef = doc(collection(db, "users", currentUser.uid, "transactions"));

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const cashBalance = userDoc.data()?.cashBalance || 0;
        const onlineBalance = userDoc.data()?.onlineBalance || 0;

        const action = input.type === "expense" ? "add_expense" : "add_income";
        const { cash, online } = getNewBalances(cashBalance, onlineBalance, input.amount, input.account, action);

        if (cash < 0) throw new Error("Insufficient Cash Balance");
        if (online < 0) throw new Error("Insufficient Online/UPI Balance");

        transaction.set(userRef, { cashBalance: cash, onlineBalance: online }, { merge: true });
        transaction.set(newTxRef, {
          ...input,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      });
    },
    [currentUser]
  );

  const updateExpense = useCallback(
    async (id: string, input: TransactionInput) => {
      if (!currentUser) throw new Error("You must be logged in to update a transaction.");
      const userRef = doc(db, "users", currentUser.uid);
      const txRef = doc(db, "users", currentUser.uid, "transactions", id);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const txDoc = await transaction.get(txRef);

        if (!txDoc.exists()) throw new Error("Transaction not found.");

        const oldData = txDoc.data() as TransactionInput;
        let cash = userDoc.data()?.cashBalance || 0;
        let online = userDoc.data()?.onlineBalance || 0;

        // Revert old transaction
        const revertAction = oldData.type === "expense" ? "remove_expense" : "remove_income";
        const reverted = getNewBalances(cash, online, oldData.amount, oldData.account, revertAction);
        
        // Apply new transaction
        const applyAction = input.type === "expense" ? "add_expense" : "add_income";
        const finalBalances = getNewBalances(reverted.cash, reverted.online, input.amount, input.account, applyAction);

        if (finalBalances.cash < 0) throw new Error("Insufficient Cash Balance");
        if (finalBalances.online < 0) throw new Error("Insufficient Online/UPI Balance");

        transaction.set(userRef, { cashBalance: finalBalances.cash, onlineBalance: finalBalances.online }, { merge: true });
        transaction.update(txRef, { ...input });
      });
    },
    [currentUser]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!currentUser) throw new Error("You must be logged in to delete a transaction.");
      const userRef = doc(db, "users", currentUser.uid);
      const txRef = doc(db, "users", currentUser.uid, "transactions", id);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const txDoc = await transaction.get(txRef);

        if (!txDoc.exists()) return;

        const oldData = txDoc.data() as TransactionInput;
        const cashBalance = userDoc.data()?.cashBalance || 0;
        const onlineBalance = userDoc.data()?.onlineBalance || 0;

        const revertAction = oldData.type === "expense" ? "remove_expense" : "remove_income";
        const { cash, online } = getNewBalances(cashBalance, onlineBalance, oldData.amount, oldData.account, revertAction);

        // Optional: Do we prevent delete if it causes negative balance? 
        // Example: deleting income could cause negative balance if already spent.
        if (cash < 0) throw new Error("Deleting this income would result in negative Cash Balance");
        if (online < 0) throw new Error("Deleting this income would result in negative Online/UPI Balance");

        transaction.set(userRef, { cashBalance: cash, onlineBalance: online }, { merge: true });
        transaction.delete(txRef);
      });
    },
    [currentUser]
  );

  // setInitialBalances for the very first time setting wallet
  const setInitialBalances = useCallback(
    async (cash: number, online: number) => {
      if (!currentUser) throw new Error("You must be logged in.");
      const userRef = doc(db, "users", currentUser.uid);
      await runTransaction(db, async (transaction) => {
        transaction.set(userRef, { cashBalance: cash, onlineBalance: online }, { merge: true });
      });
    },
    [currentUser]
  );

  return { expenses, wallet, isLoading, addExpense, updateExpense, deleteExpense, setInitialBalances };
}
