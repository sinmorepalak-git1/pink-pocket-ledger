import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  endOfWeek,
  formatINR,
  isInRange,
  startOfWeek,
  sum,
  toISODate,
} from "@/lib/expenses";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Expense History — Filter by Day, Week or Month" },
      {
        name: "description",
        content:
          "Search and filter your expense history by date, week, month, category and payment method, with totals for the filtered results.",
      },
      { property: "og:title", content: "Expense History" },
      {
        property: "og:description",
        content: "Filter and search every expense by date, category and payment method.",
      },
    ],
  }),
  component: History,
});

type RangeMode = "all" | "day" | "week" | "month";

function History() {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate({ to: "/login" });
    }
  }, [currentUser, authLoading, navigate]);

  const { expenses } = useExpenses();
  const [adding, setAdding] = useState(false);
  const today = toISODate(new Date());
  const [mode, setMode] = useState<RangeMode>("all");
  const [day, setDay] = useState(today);
  const [week, setWeek] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [category, setCategory] = useState("all");
  const [payment, setPayment] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let list = [...expenses];
    if (mode === "day") list = list.filter((e) => e.date === day);
    if (mode === "week") {
      const ref = new Date(week + "T00:00:00");
      list = list.filter((e) => isInRange(e.date, startOfWeek(ref), endOfWeek(ref)));
    }
    if (mode === "month") list = list.filter((e) => e.date.slice(0, 7) === month);
    if (category !== "all") list = list.filter((e) => e.category === category);
    if (payment !== "all") list = list.filter((e) => e.paymentMethod === payment);
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.paymentMethod.toLowerCase().includes(q),
      );
    list.sort((a, b) =>
      sort === "newest"
        ? a.date < b.date
          ? 1
          : a.date > b.date
            ? -1
            : 0
        : a.date > b.date
          ? 1
          : a.date < b.date
            ? -1
            : 0,
    );
    return list;
  }, [expenses, mode, day, week, month, category, payment, search, sort]);

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
      <h2 className="text-lg font-bold">Expense History</h2>

      <div className="card-soft space-y-3 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search expenses"
            className="h-12 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {(["all", "day", "week", "month"] as RangeMode[]).map((m) => (
            <Button
              key={m}
              type="button"
              variant={mode === m ? "default" : "secondary"}
              className="h-10 capitalize"
              onClick={() => setMode(m)}
            >
              {m}
            </Button>
          ))}
        </div>

        {mode === "day" && (
          <Input type="date" className="h-12" value={day} onChange={(e) => setDay(e.target.value)} />
        )}
        {mode === "week" && (
          <Input
            type="date"
            className="h-12"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          />
        )}
        {mode === "month" && (
          <Input
            type="month"
            className="h-12"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={payment} onValueChange={setPayment}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              {PAYMENT_METHODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm">
          <span className="text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "expense" : "expenses"}
          </span>
          <span className="font-bold text-primary">{formatINR(sum(filtered))}</span>
        </div>
      </div>

      {filtered.length ? (
        <ExpenseList expenses={filtered} />
      ) : expenses.length ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No expenses match these filters.
        </p>
      ) : (
        <EmptyState onAdd={() => setAdding(true)} />
      )}

      <ExpenseForm open={adding} onOpenChange={setAdding} />
    </div>
  );
}
