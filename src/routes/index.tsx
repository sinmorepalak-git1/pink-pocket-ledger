import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExpenseForm } from "@/components/ExpenseForm";
import { EmptyState, ExpenseList } from "@/components/ExpenseList";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import {
  categoryTotals,
  endOfWeek,
  formatINR,
  isInRange,
  monthDays,
  startOfWeek,
  sum,
  toISODate,
  weekDays,
} from "@/lib/expenses";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Expense Tracker — Track Daily Spending in ₹" },
      {
        name: "description",
        content:
          "A simple pink expense tracker to log daily spending and see day, week and month totals in Indian Rupees.",
      },
      { property: "og:title", content: "Daily Expense Tracker" },
      {
        property: "og:description",
        content: "Track your spending. Stay in control. Daily, weekly and monthly totals.",
      },
    ],
  }),
  component: Index,
});

function SummaryCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="card-soft px-4 py-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-primary">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

function Index() {
  const { currentUser, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate({ to: "/login" });
    }
  }, [currentUser, authLoading, navigate]);

  const { expenses, isLoading } = useExpenses();
  const [adding, setAdding] = useState(false);
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(toISODate(today));
  const [weekRef, setWeekRef] = useState(toISODate(today));
  const [monthRef, setMonthRef] = useState(toISODate(today).slice(0, 7));

  const totals = useMemo(() => {
    const todayISO = toISODate(today);
    const ws = startOfWeek(today);
    const we = endOfWeek(today);
    return {
      day: sum(expenses.filter((e) => e.date === todayISO)),
      week: sum(expenses.filter((e) => isInRange(e.date, ws, we))),
      month: sum(expenses.filter((e) => e.date.slice(0, 7) === todayISO.slice(0, 7))),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);

  const dayExpenses = expenses.filter((e) => e.date === selectedDate);

  const weekRefDate = new Date(weekRef + "T00:00:00");
  const weekList = weekDays(weekRefDate);
  const weekExpenses = expenses.filter((e) =>
    isInRange(e.date, startOfWeek(weekRefDate), endOfWeek(weekRefDate)),
  );

  const [monthYear, monthNum] = monthRef.split("-").map(Number);
  const monthExpenses = expenses.filter((e) => e.date.slice(0, 7) === monthRef);
  const monthDayList = monthDays((monthYear ?? 2026) - 0, (monthNum ?? 1) - 1).filter((d) =>
    monthExpenses.some((e) => e.date === toISODate(d)),
  );

  const recent = expenses.slice(0, 30);

  if (authLoading || isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-foreground">
          <LogOut className="mr-2 size-4" />
          Logout
        </Button>
      </div>

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label="Today" value={formatINR(totals.day)} note="Total spent today" />
        <SummaryCard label="This Week" value={formatINR(totals.week)} note="Total spent this week" />
        <SummaryCard label="This Month" value={formatINR(totals.month)} note="Total spent this month" />
      </section>

      <Button size="lg" className="h-14 w-full text-base" onClick={() => setAdding(true)}>
        <Plus className="size-5" /> Add Expense
      </Button>

      <section>
        <Tabs defaultValue="day">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="mt-4 space-y-3">
            <div className="card-soft space-y-3 p-4">
              <Input
                type="date"
                className="h-12"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total for this date</span>
                <span className="font-bold text-primary">{formatINR(sum(dayExpenses))}</span>
              </div>
            </div>
            {dayExpenses.length ? (
              <ExpenseList expenses={dayExpenses} />
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No expenses on this date.
              </p>
            )}
          </TabsContent>

          <TabsContent value="week" className="mt-4 space-y-3">
            <div className="card-soft space-y-3 p-4">
              <Input
                type="date"
                className="h-12"
                value={weekRef}
                onChange={(e) => setWeekRef(e.target.value)}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Weekly total</span>
                <span className="font-bold text-primary">{formatINR(sum(weekExpenses))}</span>
              </div>
              <div className="divide-y divide-border/60">
                {weekList.map((d) => {
                  const iso = toISODate(d);
                  const total = sum(weekExpenses.filter((e) => e.date === iso));
                  return (
                    <div key={iso} className="flex items-center justify-between py-2 text-sm">
                      <span>
                        {d.toLocaleDateString("en-IN", { weekday: "short" })}{" "}
                        <span className="text-muted-foreground">
                          {d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </span>
                      <span className="font-medium">{formatINR(total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="month" className="mt-4 space-y-3">
            <div className="card-soft space-y-3 p-4">
              <Input
                type="month"
                className="h-12"
                value={monthRef}
                onChange={(e) => setMonthRef(e.target.value)}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly total</span>
                <span className="font-bold text-primary">{formatINR(sum(monthExpenses))}</span>
              </div>
              {monthDayList.length ? (
                <div className="divide-y divide-border/60">
                  {monthDayList.map((d) => {
                    const iso = toISODate(d);
                    return (
                      <div key={iso} className="flex items-center justify-between py-2 text-sm">
                        <span>
                          {d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                        <span className="font-medium">
                          {formatINR(sum(monthExpenses.filter((e) => e.date === iso)))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">No expenses this month.</p>
              )}
              {monthExpenses.length > 0 && (
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Category-wise breakdown
                  </p>
                  {categoryTotals(monthExpenses).map((c) => (
                    <div key={c.category} className="flex items-center justify-between text-sm">
                      <span>{c.category}</span>
                      <span className="font-medium">{formatINR(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">Recent Expenses</h2>
        {expenses.length ? (
          <ExpenseList expenses={recent} />
        ) : (
          <EmptyState onAdd={() => setAdding(true)} />
        )}
      </section>

      <ExpenseForm open={adding} onOpenChange={setAdding} />
    </div>
  );
}
