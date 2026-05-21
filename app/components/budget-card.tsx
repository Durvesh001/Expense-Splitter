"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { SpendTag } from "../types";
import { formatMoney, parseAmount, roundToPaise } from "../lib/money";

export function BudgetCard({
  tag,
  spend,
  onUpdateBudget
}: {
  tag: SpendTag;
  spend: number;
  onUpdateBudget: (budget?: number) => void;
}) {
  const [draft, setDraft] = useState(tag.budget?.toString() ?? "");

  useEffect(() => {
    setDraft(tag.budget?.toString() ?? "");
  }, [tag.budget]);

  const save = () => {
    const parsed = parseAmount(draft);
    onUpdateBudget(parsed > 0 ? roundToPaise(parsed) : undefined);
  };

  return (
    <article className="budget-card" style={{ "--tag-color": tag.color } as CSSProperties}>
      <div className="budget-summary">
        <div>
          <span className="tag-label">
            <span />
            {tag.name}
          </span>
          <strong>{formatMoney(spend)}</strong>
        </div>
        <div className="budget-meta">
          <span>{tag.budget ? `${formatMoney(tag.budget)} budget` : "No budget"}</span>
          {tag.budget ? (
            <span className={spend > tag.budget ? "over" : ""}>{Math.round((spend / tag.budget) * 100)}%</span>
          ) : null}
        </div>
        <div className="progress-track">
          <span style={{ width: `${tag.budget ? Math.min((spend / tag.budget) * 100, 100) : 0}%` }} />
        </div>
      </div>
      <div className="budget-edit">
        <label className="field compact-field">
          <span>Budget</span>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} inputMode="decimal" />
        </label>
        <button className="icon-button" onClick={save} aria-label={`Save ${tag.name} budget`}>
          <Check size={18} />
        </button>
      </div>
    </article>
  );
}
