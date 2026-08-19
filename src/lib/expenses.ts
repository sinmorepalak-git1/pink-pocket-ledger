export type Category =
  | "Food"
  | "Travel"
  | "Shopping"
  | "Bills"
  | "Entertainment"
  | "Health"
  | "Education"
  | "Groceries"
  | "Other";

export type PaymentMethod = "Cash" | "UPI" | "Debit Card" | "Credit Card" | "Other";

export interface Expense {
  id: string;
  amount: number;
  /** ISO date string: yyyy-MM-dd */
  date: string;
  category: Category;
  description: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export const CATEGORIES: { name: Category; icon: string }[] = [
  { name: "Food", icon: "🍔" },
  { name: "Travel", icon: "🚕" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Bills", icon: "🧾" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Health", icon: "💊" },
  { name: "Education", icon: "📚" },
  { name: "Groceries", icon: "🛒" },
  { name: "Other", icon: "✨" },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "UPI",
  "Debit Card",
  "Credit Card",
  "Other",
];

export function categoryIcon(category: Category | string) {
  return CATEGORIES.find((c) => c.name === category)?.icon ?? "✨";
}

/* ------------------------------- formatting ------------------------------ */

export function formatINR(amount: number) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** e.g. 19 Aug 2026 */
export function formatIndianDate(iso: string) {
  return parseISODate(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** e.g. Today — 19 Aug */
export function dateGroupLabel(iso: string) {
  const today = toISODate(new Date());
  const yest = toISODate(new Date(Date.now() - 86400000));
  const short = parseISODate(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  if (iso === today) return `Today — ${short}`;
  if (iso === yest) return `Yesterday — ${short}`;
  return short + " " + parseISODate(iso).getFullYear();
}

/* --------------------------------- ranges -------------------------------- */

/** Week starts Monday. */
export function startOfWeek(d: Date) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date;
}

export function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  s.setDate(s.getDate() + 6);
  return s;
}

export function weekDays(d: Date) {
  const s = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(s);
    day.setDate(s.getDate() + i);
    return day;
  });
}

export function monthDays(year: number, month: number) {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => new Date(year, month, i + 1));
}

export function isInRange(iso: string, from: Date, to: Date) {
  const t = parseISODate(iso).getTime();
  return t >= new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime() &&
    t <= new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
}

export function sum(expenses: Expense[]) {
  return expenses.reduce((t, e) => t + e.amount, 0);
}

export function groupByDate(expenses: Expense[]) {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      total: sum(items),
    }));
}

export function categoryTotals(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/* --------------------------------- storage -------------------------------
 * Single storage adapter — swap this out for Lovable Cloud / Supabase later
 * without touching UI code.
 * ------------------------------------------------------------------------ */

const STORAGE_KEY = "expense-tracker:expenses:v1";

export function loadExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Expense[]) : [];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}
