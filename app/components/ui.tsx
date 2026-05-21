import type { LucideIcon } from "lucide-react";
import type { Tone } from "../types";
import { balanceText, balanceTone } from "../lib/balances";

export function Metric({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function SectionHeader({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="section-header">
      <Icon size={18} />
      <h2>{title}</h2>
    </div>
  );
}

export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return <span className={large ? "avatar large" : "avatar"}>{name.slice(0, 1).toUpperCase()}</span>;
}

export function BalanceBadge({ balance }: { balance: number }) {
  return <span className={`balance-badge ${balanceTone(balance)}`}>{balanceText(balance)}</span>;
}

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="empty-state">
      <Icon size={22} />
      <span>{text}</span>
    </div>
  );
}
