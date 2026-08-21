import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, LogOut, Download, Wallet, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExpenseForm } from "@/components/ExpenseForm";
import { AddMoneyForm } from "@/components/AddMoneyForm";
import { EditBalanceForm } from "@/components/EditBalanceForm";
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

function SummaryCard({ label, value, note, onClick }: { label: string; value: string; note: string; onClick?: () => void }) {
  return (
    <div 
      className={`card-soft px-4 py-4 ${onClick ? 'cursor-pointer hover:bg-secondary/40 transition-colors' : ''}`}
      onClick={onClick}
    >
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

  const { expenses, wallet, isLoading } = useExpenses();
  const [adding, setAdding] = useState(false);
  const [addingIncome, setAddingIncome] = useState(false);
  const [editingBalance, setEditingBalance] = useState(false);
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

  const totalBalance = wallet.cashBalance + wallet.onlineBalance;

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditingBalance(true)} className="h-8">
            <Settings2 className="mr-2 size-4" />
            Balances
          </Button>
          <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-foreground h-8">
            <LogOut className="mr-2 size-4" />
            Logout
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard 
          label="Cash" 
          value={formatINR(wallet.cashBalance)} 
          note="Available cash"
          onClick={() => setEditingBalance(true)}
        />
        <SummaryCard 
          label="Online / UPI" 
          value={formatINR(wallet.onlineBalance)} 
          note="Bank balance" 
          onClick={() => setEditingBalance(true)}
        />
        <SummaryCard 
          label="Total Available" 
          value={formatINR(totalBalance)} 
          note="Total funds" 
        />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" className="h-14 w-full text-base" onClick={() => setAdding(true)}>
          <Plus className="mr-2 size-5" /> Add Expense
        </Button>
        <Button size="lg" className="h-14 w-full text-base bg-green-600 hover:bg-green-700" onClick={() => setAddingIncome(true)}>
          <Download className="mr-2 size-5" /> Add Money
        </Button>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">Spending Insights</h2>
        </div>
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
                <span className="text-muted-foreground">Spent on this date</span>
                <span className="font-bold text-primary">{formatINR(sum(dayExpenses))}</span>
              </div>
            </div>
            {dayExpenses.length ? (
              <ExpenseList expenses={dayExpenses} />
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No transactions on this date.
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
                <span className="text-muted-foreground">Spent this week</span>
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
                <span className="text-muted-foreground">Spent this month</span>
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
                <p className="py-2 text-sm text-muted-foreground">No transactions this month.</p>
              )}
              {monthExpenses.length > 0 && (
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Category-wise expense breakdown
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

      <section className="space-y-3 pb-8">
        <h2 className="text-base font-bold">Recent Transactions</h2>
        {expenses.length ? (
          <ExpenseList expenses={recent} />
        ) : (
          <EmptyState onAdd={() => setAdding(true)} />
        )}
      </section>

      <ExpenseForm open={adding} onOpenChange={setAdding} />
      <AddMoneyForm open={addingIncome} onOpenChange={setAddingIncome} />
      <EditBalanceForm open={editingBalance} onOpenChange={setEditingBalance} />
    </div>
  );
}
