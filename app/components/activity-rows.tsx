import type { CSSProperties } from "react";
import { HandCoins, ReceiptText } from "lucide-react";
import type { Expense, ExpenseSplit, Person, Settlement, SpendTag } from "../types";
import { getShare } from "../lib/balances";
import { formatDate } from "../lib/dates";
import { personName, tagById } from "../lib/lookups";
import { formatMoney } from "../lib/money";

export function ExpenseRow({
  expense,
  tags,
  people,
  viewerId,
  focusUserId
}: {
  expense: Expense;
  tags: SpendTag[];
  people: Person[];
  viewerId: string;
  focusUserId?: string;
}) {
  const tag = tagById(tags, expense.tagId);
  const viewerShare = getShare(expense, focusUserId ?? viewerId);
  const paidByName = expense.paidBy === viewerId ? "You" : personName(people, expense.paidBy);

  return (
    <article className="timeline-row">
      <div className="tag-dot" style={{ "--tag-color": tag.color } as CSSProperties}>
        <ReceiptText size={18} />
      </div>
      <div>
        <strong>{expense.title}</strong>
        <span>
          {tag.name} - paid by {paidByName} - {formatDate(expense.date)}
        </span>
        {expense.note ? <em>{expense.note}</em> : null}
      </div>
      <div className="row-amount">
        <strong>{formatMoney(expense.amount)}</strong>
        <span>share {formatMoney(viewerShare, true)}</span>
      </div>
    </article>
  );
}

export function SettlementRow({ settlement, friend }: { settlement: Settlement; friend?: Person }) {
  return (
    <article className="timeline-row settlement">
      <div className="tag-dot settle-dot">
        <HandCoins size={18} />
      </div>
      <div>
        <strong>{settlement.direction === "paid" ? "You paid" : "You received"}</strong>
        <span>
          {friend?.name ?? "Friend"} - {formatDate(settlement.date)}
        </span>
        {settlement.note ? <em>{settlement.note}</em> : null}
      </div>
      <div className="row-amount">
        <strong>{formatMoney(settlement.amount)}</strong>
        <span>settled</span>
      </div>
    </article>
  );
}

export function TagProgress({ tag, spend }: { tag: SpendTag; spend: number }) {
  const percent = tag.budget ? Math.min((spend / tag.budget) * 100, 100) : 0;
  const isOver = tag.budget ? spend > tag.budget : false;

  return (
    <article className="tag-progress" style={{ "--tag-color": tag.color } as CSSProperties}>
      <div>
        <span className="tag-label">
          <span />
          {tag.name}
        </span>
        <strong>{formatMoney(spend)}</strong>
      </div>
      <div className="budget-meta">
        <span>{tag.budget ? `${formatMoney(tag.budget)} budget` : "No budget"}</span>
        {tag.budget ? <span className={isOver ? "over" : ""}>{Math.round((spend / tag.budget) * 100)}%</span> : null}
      </div>
      <div className="progress-track">
        <span style={{ width: `${percent}%` }} />
      </div>
    </article>
  );
}

export function SplitPreview({
  splits,
  people,
  profileId,
  tag
}: {
  splits: ExpenseSplit[];
  people: Person[];
  profileId: string;
  tag: SpendTag;
}) {
  if (!splits.length) return null;

  return (
    <div className="split-preview" style={{ "--tag-color": tag.color } as CSSProperties}>
      {splits.map((split) => (
        <div key={split.userId}>
          <span>{split.userId === profileId ? "You" : personName(people, split.userId)}</span>
          <strong>{formatMoney(split.amount, true)}</strong>
        </div>
      ))}
    </div>
  );
}
