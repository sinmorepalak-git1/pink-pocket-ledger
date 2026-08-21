import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useExpenses } from "@/hooks/useExpenses";
import {
  categoryIcon,
  formatINR,
  toISODate,
  filterByDateRange,
  type DateRangeType,
} from "@/lib/expenses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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

export function DashboardChart() {
  const { expenses } = useExpenses();
  const [rangeType, setRangeType] = useState<DateRangeType>("This Month");
  const [customStart, setCustomStart] = useState(toISODate(new Date()));
  const [customEnd, setCustomEnd] = useState(toISODate(new Date()));

  const filteredTransactions = useMemo(
    () => filterByDateRange(expenses, rangeType, customStart, customEnd),
    [expenses, rangeType, customStart, customEnd]
  );

  const expenseTransactions = filteredTransactions.filter((e) => e.type === "expense");

  const { totalExpense, catData } = useMemo(() => {
    let total = 0;
    const map = new Map<string, number>();

    expenseTransactions.forEach((e) => {
      total += e.amount;
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });

    const data = Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { totalExpense: total, catData: data };
  }, [expenseTransactions]);

  return (
    <section className="space-y-3 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Spending by Category</h2>
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
            <SelectItem value="Custom Date Range">Custom Date Range</SelectItem>
          </SelectContent>
        </Select>

        {rangeType === "Custom Date Range" && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
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

      <div className="card-soft p-5">
        {catData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground font-medium">
              No expenses to analyse yet.
            </p>
          </div>
        ) : (
          <>
            <div className="h-64 mb-6 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {catData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => formatINR(val)}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-primary">{formatINR(totalExpense)}</span>
              </div>
            </div>

            <div className="space-y-3">
              {catData.map((c, i) => {
                const pct = totalExpense ? Math.round((c.amount / totalExpense) * 100) : 0;
                return (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      ></div>
                      <span className="font-medium">
                        {categoryIcon(c.category)} {c.category}
                      </span>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-bold">{formatINR(c.amount)}</span>
                      <span className="text-[11px] font-semibold text-muted-foreground w-8 text-right bg-secondary/50 px-1 py-0.5 rounded">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
