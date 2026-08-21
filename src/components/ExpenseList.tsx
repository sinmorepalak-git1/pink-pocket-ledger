import { useState } from "react";
import { MoreVertical, Pencil, Trash2, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/components/ExpenseForm";
import { AddMoneyForm } from "@/components/AddMoneyForm";
import { useExpenses } from "@/hooks/useExpenses";
import {
  categoryIcon,
  dateGroupLabel,
  formatINR,
  formatIndianDate,
  groupByDate,
  type Transaction,
} from "@/lib/expenses";
import { toast } from "sonner";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card-soft flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Wallet className="size-7" />
      </div>
      <h3 className="text-lg font-semibold">No transactions yet</h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        Start tracking your spending by adding your first transaction.
      </p>
      <Button size="lg" className="mt-2 h-12" onClick={onAdd}>
        + Add Expense
      </Button>
    </div>
  );
}

function ExpenseRow({ transaction }: { transaction: Transaction }) {
  const { deleteExpense } = useExpenses();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isIncome = transaction.type === "income";
  const displayAccount = transaction.account === "cash" ? "Cash" : "Online / UPI";

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteExpense(transaction.id);
      toast.success("Transaction deleted successfully.");
      setConfirming(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-xl">
        {categoryIcon(transaction.category)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{transaction.description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {transaction.category} · {displayAccount} · {formatIndianDate(transaction.date)}
        </p>
      </div>
      <p className={`shrink-0 font-semibold ${isIncome ? "text-green-600" : "text-primary"}`}>
        {isIncome ? "+" : "-"} {formatINR(transaction.amount)}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9 shrink-0">
            <MoreVertical className="size-4" />
            <span className="sr-only">Transaction actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <Pencil className="mr-2 size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="mr-2 size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isIncome ? (
        <AddMoneyForm open={editing} onOpenChange={setEditing} income={transaction} />
      ) : (
        <ExpenseForm open={editing} onOpenChange={setEditing} expense={transaction} />
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              {transaction.description} · {formatINR(transaction.amount)} will be removed
              permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ExpenseList({ expenses }: { expenses: Transaction[] }) {
  const groups = groupByDate(expenses);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.date} className="card-soft overflow-hidden">
          <div className="flex items-center justify-between bg-secondary/70 px-4 py-2.5">
            <span className="text-sm font-semibold">{dateGroupLabel(group.date)}</span>
            <span className="text-sm font-semibold text-primary">
              Spent: {formatINR(group.total)}
            </span>
          </div>
          {group.items.map((e) => (
            <ExpenseRow key={e.id} transaction={e} />
          ))}
        </div>
      ))}
    </div>
  );
}
