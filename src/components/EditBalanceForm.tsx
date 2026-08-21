import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExpenses } from "@/hooks/useExpenses";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBalanceForm({ open, onOpenChange }: Props) {
  const { wallet, setInitialBalances } = useExpenses();
  const [cash, setCash] = useState("");
  const [online, setOnline] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCash(String(wallet.cashBalance));
    setOnline(String(wallet.onlineBalance));
  }, [open, wallet]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    
    const cashVal = Number(cash);
    const onlineVal = Number(online);
    
    if (cashVal < 0 || onlineVal < 0) {
      toast.error("Balances cannot be negative");
      return;
    }
    
    setIsSaving(true);
    try {
      await setInitialBalances(cashVal, onlineVal);
      toast.success("Wallet balances updated successfully.");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update balances.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Wallet Balances</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cash-balance">Cash Balance ₹</Label>
            <Input
              id="cash-balance"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="online-balance">Online / UPI Balance ₹</Label>
            <Input
              id="online-balance"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={online}
              onChange={(e) => setOnline(e.target.value)}
              className="h-12"
            />
          </div>

          <DialogFooter>
            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Balances"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
