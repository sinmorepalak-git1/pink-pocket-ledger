import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, CalendarDays, Home, Plus } from "lucide-react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/history", label: "History", icon: CalendarDays },
  { to: "/summary", label: "Summary", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <CalendarDays className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold tracking-tight">
              Daily Expense Tracker
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Track your spending. Stay in control.
            </p>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-primary" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <Button className="ml-2 h-10" onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Add
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-5 pb-28 sm:pb-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/95 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          <BottomLink to="/" label="Home" icon={Home} exact />
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-primary"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="size-5" />
            </span>
            Add
          </button>
          <BottomLink to="/history" label="History" icon={CalendarDays} />
          <BottomLink to="/summary" label="Summary" icon={BarChart3} />
        </div>
      </nav>

      <ExpenseForm open={adding} onOpenChange={setAdding} />
    </div>
  );
}

function BottomLink({
  to,
  label,
  icon: Icon,
  exact,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground"
      activeProps={{ className: "text-primary" }}
      activeOptions={{ exact: !!exact }}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

export function useAddExpenseDialog() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
