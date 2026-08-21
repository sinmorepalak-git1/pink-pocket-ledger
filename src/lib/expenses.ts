export type Category =
  | "Food"
  | "Travel"
  | "Shopping"
  | "Bills"
  | "Entertainment"
  | "Health"
  | "Education"
  | "Groceries"
  | "Other"
  | "Income";

export type AccountType = "cash" | "online";
export type PaymentMethod = "Cash" | "Online / UPI";

export interface Wallet {
  cashBalance: number;
  onlineBalance: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "expense" | "income";
  amount: number;
  /** ISO date string: yyyy-MM-dd */
  date: string;
  category: Category | string;
  description: string;
  account: AccountType;
  createdAt: string;
}

// Alias for backwards compatibility in components during refactoring
export type Expense = Transaction;

export const CATEGORIES: { name: Category | string; icon: string }[] = [
  { name: "Food", icon: "🍔" },
  { name: "Travel", icon: "🚕" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Bills", icon: "🧾" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Health", icon: "💊" },
  { name: "Education", icon: "📚" },
  { name: "Groceries", icon: "🛒" },
  { name: "Other", icon: "✨" },
  { name: "Income", icon: "💰" },
];

export const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Online / UPI"];

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
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
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

export function sum(transactions: Transaction[]) {
  return transactions.reduce((t, e) => {
    return e.type === "expense" ? t + e.amount : t;
  }, 0);
}

export function sumIncome(transactions: Transaction[]) {
  return transactions.reduce((t, e) => {
    return e.type === "income" ? t + e.amount : t;
  }, 0);
}

export function netSum(transactions: Transaction[]) {
  return transactions.reduce((t, e) => {
    return e.type === "expense" ? t - e.amount : t + e.amount;
  }, 0);
}

export function groupByDate(transactions: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  for (const e of transactions) {
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

export function categoryTotals(transactions: Transaction[]) {
  const map = new Map<string, number>();
  for (const e of transactions) {
    if (e.type === "expense") {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/* --------------------------------- storage -------------------------------
 * Handled via Firestore in useExpenses
 * ------------------------------------------------------------------------ */

export function createId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EXP-${timestamp}-${random}`;
}
