"use client";

import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { Plus, Tag, WalletCards } from "lucide-react";
import { BudgetCard } from "../components/budget-card";
import { SectionHeader } from "../components/ui";
import { TAG_COLORS } from "../constants";
import { getTagSpend } from "../lib/balances";
import { makeId } from "../lib/ids";
import { parseAmount, roundToPaise } from "../lib/money";
import type { AppData, SpendTag } from "../types";

export function TagsScreen({
  data,
  onAddTag,
  onUpdateTagBudget
}: {
  data: AppData;
  onAddTag: (tag: SpendTag) => void;
  onUpdateTagBudget: (tagId: string, budget?: number) => void;
}) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [error, setError] = useState("");
  const profile = data.profile!;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Add a tag name.");
      return;
    }

    const tagExists = data.tags.some((tag) => tag.name.toLowerCase() === trimmedName.toLowerCase());
    if (tagExists) {
      setError("Tag already exists.");
      return;
    }

    const parsedBudget = parseAmount(budget);
    onAddTag({
      id: makeId(),
      name: trimmedName,
      color,
      budget: parsedBudget > 0 ? roundToPaise(parsedBudget) : undefined,
      isCustom: true
    });
    setName("");
    setBudget("");
    setError("");
  };

  return (
    <div className="stack">
      <section className="tool-panel">
        <SectionHeader title="New tag" icon={Tag} />
        <form className="form-stack" onSubmit={submit}>
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Fuel, school, gifts" />
          </label>
          <label className="field">
            <span>Monthly budget</span>
            <input value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="decimal" />
          </label>
          <div className="swatch-row" role="radiogroup" aria-label="Tag color">
            {TAG_COLORS.map((item) => (
              <button
                type="button"
                key={item}
                className={item === color ? "swatch selected" : "swatch"}
                style={{ "--tag-color": item } as CSSProperties}
                onClick={() => setColor(item)}
                aria-label={item}
              />
            ))}
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit">
            <Plus size={18} />
            Add tag
          </button>
        </form>
      </section>

      <section className="section-block">
        <SectionHeader title="Budgets" icon={WalletCards} />
        <div className="tag-progress-list">
          {data.tags.map((tag) => (
            <BudgetCard
              key={tag.id}
              tag={tag}
              spend={getTagSpend(data, profile.id, tag.id)}
              onUpdateBudget={(value) => onUpdateTagBudget(tag.id, value)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
