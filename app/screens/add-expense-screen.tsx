"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Plus, ReceiptText, Settings2, UserPlus } from "lucide-react";
import { SplitPreview } from "../components/activity-rows";
import { Avatar, SectionHeader } from "../components/ui";
import { todayInputValue } from "../lib/dates";
import { makeId } from "../lib/ids";
import { tagById } from "../lib/lookups";
import { parseAmount, roundToPaise } from "../lib/money";
import { buildDraftSplitValues, calculateSplitPreview } from "../lib/splits";
import type { AppData, Expense, Person, SplitType } from "../types";

export function AddExpenseScreen({
  data,
  people,
  onAddExpense,
  onJumpToFriends
}: {
  data: AppData;
  people: Person[];
  onAddExpense: (expense: Expense) => void;
  onJumpToFriends: () => void;
}) {
  const profile = data.profile!;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(profile.id);
  const [tagId, setTagId] = useState(data.tags[0]?.id ?? "");
  const [date, setDate] = useState(todayInputValue());
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [participantIds, setParticipantIds] = useState<string[]>([profile.id]);
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const amountNumber = parseAmount(amount);

  const peopleById = useMemo(() => Object.fromEntries(people.map((person) => [person.id, person])), [people]);

  const setSplitMode = (next: SplitType) => {
    setSplitType(next);
    setSplitValues(buildDraftSplitValues(next, participantIds, amountNumber));
  };

  const toggleParticipant = (id: string) => {
    setParticipantIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      setSplitValues(buildDraftSplitValues(splitType, next, amountNumber));
      return next;
    });
  };

  const refreshSplitValues = () => {
    setSplitValues(buildDraftSplitValues(splitType, participantIds, amountNumber));
  };

  const splitPreview = useMemo(
    () =>
      calculateSplitPreview({
        amount: amountNumber,
        participantIds,
        splitType,
        splitValues
      }),
    [amountNumber, participantIds, splitType, splitValues]
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Add a title.");
      return;
    }

    if (amountNumber <= 0) {
      setError("Add a valid amount.");
      return;
    }

    if (!participantIds.length) {
      setError("Select at least one person.");
      return;
    }

    if (splitPreview.error) {
      setError(splitPreview.error);
      return;
    }

    onAddExpense({
      id: makeId(),
      title: trimmedTitle,
      amount: roundToPaise(amountNumber),
      paidBy,
      tagId,
      date,
      splitType,
      splits: splitPreview.splits,
      note: note.trim() || undefined
    });

    setTitle("");
    setAmount("");
    setPaidBy(profile.id);
    setTagId(data.tags[0]?.id ?? "");
    setDate(todayInputValue());
    setSplitType("equal");
    setParticipantIds([profile.id]);
    setSplitValues({});
    setNote("");
    setError("");
  };

  return (
    <div className="stack">
      <section className="tool-panel">
        <SectionHeader title="Expense" icon={ReceiptText} />
        <form className="form-stack" onSubmit={submit}>
          <label className="field">
            <span>Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dinner, rent, medicines" />
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Amount</span>
              <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
            </label>
            <label className="field">
              <span>Date</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          </div>

          <label className="field">
            <span>Paid by</span>
            <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.id === profile.id ? "You" : person.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tag</span>
            <select value={tagId} onChange={(event) => setTagId(event.target.value)}>
              {data.tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>

          <section className="inline-section">
            <div className="inline-section-header">
              <span>Split between</span>
              {!data.friends.length ? (
                <button type="button" className="text-button small" onClick={onJumpToFriends}>
                  <UserPlus size={16} />
                  Add friend
                </button>
              ) : null}
            </div>
            <div className="chip-grid">
              {people.map((person) => (
                <button
                  type="button"
                  key={person.id}
                  className={participantIds.includes(person.id) ? "person-chip selected" : "person-chip"}
                  onClick={() => toggleParticipant(person.id)}
                >
                  <Avatar name={person.name} />
                  {person.id === profile.id ? "You" : person.name}
                </button>
              ))}
            </div>
          </section>

          <section className="inline-section">
            <div className="inline-section-header">
              <span>Split type</span>
              {splitType !== "equal" ? (
                <button type="button" className="text-button small" onClick={refreshSplitValues}>
                  <Settings2 size={16} />
                  Distribute
                </button>
              ) : null}
            </div>
            <div className="segmented">
              <button type="button" className={splitType === "equal" ? "active" : ""} onClick={() => setSplitMode("equal")}>
                Equal
              </button>
              <button type="button" className={splitType === "exact" ? "active" : ""} onClick={() => setSplitMode("exact")}>
                Exact
              </button>
              <button
                type="button"
                className={splitType === "percentage" ? "active" : ""}
                onClick={() => setSplitMode("percentage")}
              >
                %
              </button>
            </div>
          </section>

          {splitType !== "equal" ? (
            <div className="split-inputs">
              {participantIds.map((userId) => (
                <label key={userId} className="split-field">
                  <span>{peopleById[userId]?.id === profile.id ? "You" : peopleById[userId]?.name}</span>
                  <input
                    value={splitValues[userId] ?? ""}
                    onChange={(event) => setSplitValues((current) => ({ ...current, [userId]: event.target.value }))}
                    inputMode="decimal"
                    placeholder={splitType === "percentage" ? "%" : "INR"}
                  />
                </label>
              ))}
            </div>
          ) : null}

          <label className="field">
            <span>Note</span>
            <input value={note} onChange={(event) => setNote(event.target.value)} />
          </label>

          <SplitPreview splits={splitPreview.splits} people={people} profileId={profile.id} tag={tagById(data.tags, tagId)} />

          {error || splitPreview.error ? <p className="form-error">{error || splitPreview.error}</p> : null}
          <button className="primary-button" type="submit">
            <Plus size={18} />
            Save expense
          </button>
        </form>
      </section>
    </div>
  );
}
