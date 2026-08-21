import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import {
  categoryIcon,
  formatINR,
  toISODate,
  filterByDateRange,
  getHighestSpendingCategory,
  getHighestSpendingDay,
  getHighestSingleExpense,
  sum,
  type DateRangeType,
  formatIndianDate,
} from "@/lib/expenses";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Analysis — Expense Breakdown" },
      { name: "description", content: "Deep dive into your expense analysis." },
    ],
  }),
  component: Summary,
});

const COLORS = [
  "#ec4899", // pink-500
  "#8b5cf6", // violet-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
];

function Summary() {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate({ to: "/login" });
    }
  }, [currentUser, authLoading, navigate]);

  const { expenses } = useExpenses();
  const [rangeType, setRangeType] = useState<DateRangeType>("This Month");
  const [customStart, setCustomStart] = useState(toISODate(new Date()));
  const [customEnd, setCustomEnd] = useState(toISODate(new Date()));

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) return null;

  const filteredTransactions = filterByDateRange(expenses, rangeType, customStart, customEnd);
  const expenseTransactions = filteredTransactions.filter((e) => e.type === "expense");
  const totalExpense = sum(expenseTransactions);

  // Highest Spending
  const highestCat = getHighestSpendingCategory(filteredTransactions);
  const highestDay = getHighestSpendingDay(filteredTransactions);
  const highestSingle = getHighestSingleExpense(filteredTransactions);

  // Spending by Category
  const catMap = new Map<
    string,
    { total: number; count: number; other: Map<string, number> }
  >();
  
  expenseTransactions.forEach((e) => {
    const stat = catMap.get(e.category) || { total: 0, count: 0, other: new Map() };
    stat.total += e.amount;
    stat.count += 1;
    if (e.category === "Other Expense" && e.customCategory) {
      stat.other.set(e.customCategory, (stat.other.get(e.customCategory) || 0) + e.amount);
    }
    catMap.set(e.category, stat);
  });

  const catData = Array.from(catMap.entries())
    .map(([category, stat]) => ({
      category,
      total: stat.total,
      count: stat.count,
      other: Array.from(stat.other.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.total - a.total);

  // Spending by Payment Method
  let cashTotal = 0;
  let onlineTotal = 0;
  expenseTransactions.forEach((e) => {
    if (e.account === "cash") cashTotal += e.amount;
    else onlineTotal += e.amount;
  });
  const paymentData = [
    { name: "Online / UPI", value: onlineTotal },
    { name: "Cash", value: cashTotal },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 pb-12 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Analysis</h1>
      </div>

      <div className="space-y-3">
        <Select value={rangeType} onValueChange={(v) => setRangeType(v as DateRangeType)}>
          <SelectTrigger className="h-12 w-full font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Today">Today</SelectItem>
            <SelectItem value="This Week">This Week</SelectItem>
            <SelectItem value="This Month">This Month</SelectItem>
            <SelectItem value="Last Month">Last Month</SelectItem>
            <SelectItem value="This Year">This Year</SelectItem>
            <SelectItem value="Custom Date Range">Custom Date Range</SelectItem>
          </SelectContent>
        </Select>

        {rangeType === "Custom Date Range" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">From</p>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">To</p>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="card-soft p-5 bg-gradient-to-br from-pink-500/10 to-purple-500/10">
        <p className="text-sm font-semibold text-muted-foreground">Total Spending</p>
        <p className="mt-1 text-4xl font-bold text-primary">{formatINR(totalExpense)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {expenseTransactions.length} transactions
        </p>
      </div>

      {highestCat && (
        <section className="space-y-3">
          <h3 className="text-base font-bold">Highest Spending</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card-soft p-4 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground">Category</span>
              <div className="mt-2">
                <span className="font-semibold text-sm">{categoryIcon(highestCat.category)} {highestCat.category}</span>
                <p className="text-lg font-bold text-primary mt-1">{formatINR(highestCat.total)}</p>
              </div>
            </div>
            {highestDay && (
              <div className="card-soft p-4 flex flex-col justify-between">
                <span className="text-xs text-muted-foreground">Day</span>
                <div className="mt-2">
                  <span className="font-semibold text-sm">{formatIndianDate(highestDay.date)}</span>
                  <p className="text-lg font-bold text-primary mt-1">{formatINR(highestDay.total)}</p>
                </div>
              </div>
            )}
            {highestSingle && (
              <div className="card-soft p-4 flex flex-col justify-between">
                <span className="text-xs text-muted-foreground">Single Expense</span>
                <div className="mt-2">
                  <span className="font-semibold text-sm">{highestSingle.category}</span>
                  <p className="text-lg font-bold text-primary mt-1">{formatINR(highestSingle.amount)}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {catData.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-bold">Spending by Category</h3>
          <div className="card-soft p-5">
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {catData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatINR(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              {catData.map((c, i) => {
                const pct = totalExpense ? Math.round((c.total / totalExpense) * 100) : 0;
                return (
                  <div key={c.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="font-medium">
                          {categoryIcon(c.category)} {c.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatINR(c.total)}</p>
                        <p className="text-[11px] text-muted-foreground">{pct}% • {c.count} txns</p>
                      </div>
                    </div>
                    {c.category === "Other Expense" && c.other.length > 0 && (
                      <div className="ml-5 pl-3 border-l-2 border-border space-y-1 mt-1">
                        {c.other.map((sub) => (
                          <div key={sub.name} className="flex justify-between text-xs text-muted-foreground">
                            <span>{sub.name}</span>
                            <span>{formatINR(sub.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {paymentData.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-bold">Spending by Payment Method</h3>
          <div className="card-soft p-5">
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip formatter={(val: number) => formatINR(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              {paymentData.map((p, i) => {
                const pct = totalExpense ? Math.round((p.value / totalExpense) * 100) : 0;
                return (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? "#8b5cf6" : "#10b981" }}></div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatINR(p.value)}</p>
                      <p className="text-[11px] text-muted-foreground">{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
