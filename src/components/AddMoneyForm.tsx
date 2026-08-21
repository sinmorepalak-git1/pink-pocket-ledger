import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toISODate, type Transaction, type PaymentMethod, PAYMENT_METHODS } from "@/lib/expenses";
import { useExpenses } from "@/hooks/useExpenses";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the form edits this income instead of creating one. */
  income?: Transaction;
}

export function AddMoneyForm({ open, onOpenChange, income }: Props) {
  const { addExpense, updateExpense } = useExpenses();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [source, setSource] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Online / UPI");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(income ? String(income.amount) : "");
    setDate(income?.date ?? toISODate(new Date()));
    setSource(income?.description ?? "");
    setPaymentMethod(income?.account === "cash" ? "Cash" : "Online / UPI");
  }, [open, income]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const payload = {
      type: "income" as const,
      amount: value,
      date,
      category: "Income",
      description: source.trim() || "Added Money",
      account: (paymentMethod === "Cash" ? "cash" : "online") as "cash" | "online",
    };
    
    setIsSaving(true);
    try {
      if (income) {
        await updateExpense(income.id, payload);
        toast.success("Income updated successfully.");
      } else {
        await addExpense(payload);
        toast.success("Income saved successfully.");
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save income.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{income ? "Edit Income" : "Add Money"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-amount">Amount ₹</Label>
            <Input
              id="income-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 text-2xl font-semibold text-green-600"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-date">Date</Label>
            <Input
              id="income-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-source">Source / Note</Label>
            <Input
              id="income-source"
              placeholder="e.g. Salary, Returned money"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Account</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" size="lg" className="h-14 w-full text-base bg-green-600 hover:bg-green-700" disabled={isSaving}>
              {isSaving
                ? income
                  ? "Updating..."
                  : "Saving..."
                : income
                  ? "Update Income"
                  : "Add Money"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
