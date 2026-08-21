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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  toISODate,
  type Category,
  type Expense,
  type PaymentMethod,
} from "@/lib/expenses";
import { useExpenses } from "@/hooks/useExpenses";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the form edits this expense instead of creating one. */
  expense?: Expense;
}

export function ExpenseForm({ open, onOpenChange, expense }: Props) {
  const { addExpense, updateExpense } = useExpenses();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [category, setCategory] = useState<Category>("Food");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(expense ? String(expense.amount) : "");
    setDate(expense?.date ?? toISODate(new Date()));
    setCategory(expense?.category ?? "Food");
    setDescription(expense?.description ?? "");
    setPaymentMethod(expense?.paymentMethod ?? "UPI");
  }, [open, expense]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const payload = {
      amount: value,
      date,
      category,
      description: description.trim() || category,
      paymentMethod,
    };
    
    setIsSaving(true);
    try {
      if (expense) {
        await updateExpense(expense.id, payload);
        toast.success("Expense updated successfully.");
      } else {
        await addExpense(payload);
        toast.success("Expense saved successfully.");
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save expense.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ₹</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 text-2xl font-semibold"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    <span className="mr-2">{c.icon}</span>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Description / Note</Label>
            <Textarea
              id="note"
              rows={2}
              placeholder="e.g. Lunch with friends"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
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
            <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={isSaving}>
              {isSaving
                ? expense
                  ? "Updating..."
                  : "Saving..."
                : expense
                  ? "Update Expense"
                  : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
