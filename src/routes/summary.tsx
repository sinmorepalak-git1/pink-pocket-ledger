import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { categoryIcon, categoryTotals, formatINR, sum, toISODate } from "@/lib/expenses";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Monthly Summary — Category-wise Expense Breakdown" },
      {
        name: "description",
        content:
          "See your monthly expense total, transaction count, average daily spend and a category-wise breakdown in Indian Rupees.",
      },
      { property: "og:title", content: "Monthly Expense Summary" },
      {
        property: "og:description",
        content: "Monthly total, transactions, daily average and category-wise spending.",
      },
    ],
  }),
  component: Summary,
});

function Summary() {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate({ to: "/login" });
    }
  }, [currentUser, authLoading, navigate]);

  const { expenses } = useExpenses();
  const [month, setMonth] = useState(toISODate(new Date()).slice(0, 7));

  const monthExpenses = expenses.filter((e) => e.date.slice(0, 7) === month);
  const total = sum(monthExpenses);
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y ?? 2026, (m ?? 1) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(y ?? 2026, m ?? 1, 0).getDate();
  const avgDaily = total / daysInMonth;
  const cats = categoryTotals(monthExpenses);

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Monthly Summary</h2>

      <Input
        type="month"
        className="h-12"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      />

      <div className="card-soft p-5">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 text-4xl font-bold text-primary">{formatINR(total)}</p>
        <p className="text-xs text-muted-foreground">Total expense</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-xl font-semibold">{monthExpenses.length}</p>
          </div>
          <div className="rounded-xl bg-secondary/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">Avg daily expense</p>
            <p className="text-xl font-semibold">{formatINR(avgDaily)}</p>
          </div>
        </div>
      </div>

      <div className="card-soft space-y-4 p-5">
        <h3 className="text-sm font-bold">Category breakdown</h3>
        {cats.length ? (
          cats.map((c) => {
            const pct = total ? Math.round((c.total / total) * 100) : 0;
            return (
              <div key={c.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {categoryIcon(c.category)} {c.category}
                  </span>
                  <span className="font-medium">
                    {formatINR(c.total)}{" "}
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No expenses in this month yet.</p>
        )}
      </div>
    </div>
  );
}
