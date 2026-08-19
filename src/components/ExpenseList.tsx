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
import { useExpenses } from "@/hooks/useExpenses";
import {
  categoryIcon,
  dateGroupLabel,
  formatINR,
  formatIndianDate,
  groupByDate,
  type Expense,
} from "@/lib/expenses";
import { toast } from "sonner";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card-soft flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Wallet className="size-7" />
      </div>
      <h3 className="text-lg font-semibold">No expenses yet</h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        Start tracking your spending by adding your first expense.
      </p>
      <Button size="lg" className="mt-2 h-12" onClick={onAdd}>
        + Add Expense
      </Button>
    </div>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const { deleteExpense } = useExpenses();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-xl">
        {categoryIcon(expense.category)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{expense.description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {expense.category} · {expense.paymentMethod} · {formatIndianDate(expense.date)}
        </p>
      </div>
      <p className="shrink-0 font-semibold text-primary">{formatINR(expense.amount)}</p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9 shrink-0">
            <MoreVertical className="size-4" />
            <span className="sr-only">Expense actions</span>
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

      <ExpenseForm open={editing} onOpenChange={setEditing} expense={expense} />

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {expense.description} · {formatINR(expense.amount)} will be removed
              permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteExpense(expense.id);
                toast.success("Expense deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const groups = groupByDate(expenses);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.date} className="card-soft overflow-hidden">
          <div className="flex items-center justify-between bg-secondary/70 px-4 py-2.5">
            <span className="text-sm font-semibold">{dateGroupLabel(group.date)}</span>
            <span className="text-sm font-semibold text-primary">
              Total: {formatINR(group.total)}
            </span>
          </div>
          {group.items.map((e) => (
            <ExpenseRow key={e.id} expense={e} />
          ))}
        </div>
      ))}
    </div>
  );
}
