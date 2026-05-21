"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Activity, ArrowLeft, Check, ChevronRight, HandCoins, Plus, ReceiptText, UserPlus, Users } from "lucide-react";
import { ExpenseRow, SettlementRow } from "../components/activity-rows";
import { Avatar, BalanceBadge, EmptyState, SectionHeader } from "../components/ui";
import { calculateFriendBalance, balanceText, balanceTone } from "../lib/balances";
import { todayInputValue } from "../lib/dates";
import { makeId } from "../lib/ids";
import { sortNewestFirst } from "../lib/lookups";
import { parseAmount, roundToPaise } from "../lib/money";
import type { AppData, Person, Settlement } from "../types";

export function FriendsScreen({
  data,
  people,
  selectedFriendId,
  onSelectFriend,
  onAddFriend,
  onAddSettlement
}: {
  data: AppData;
  people: Person[];
  selectedFriendId: string | null;
  onSelectFriend: (friendId: string | null) => void;
  onAddFriend: (friend: Person) => void;
  onAddSettlement: (settlement: Settlement) => void;
}) {
  const selectedFriend = data.friends.find((friend) => friend.id === selectedFriendId);

  if (selectedFriend) {
    return (
      <FriendDetail
        data={data}
        people={people}
        friend={selectedFriend}
        onBack={() => onSelectFriend(null)}
        onAddSettlement={onAddSettlement}
      />
    );
  }

  return (
    <div className="stack">
      <AddFriendForm
        existingEmails={data.friends.map((friend) => friend.email.toLowerCase())}
        onAddFriend={onAddFriend}
      />
      <section className="section-block">
        <SectionHeader title="Balances" icon={HandCoins} />
        <div className="friend-list">
          {data.friends.map((friend) => (
            <button key={friend.id} className="friend-row" onClick={() => onSelectFriend(friend.id)}>
              <Avatar name={friend.name} />
              <div>
                <strong>{friend.name}</strong>
                <span>{friend.email}</span>
              </div>
              <BalanceBadge balance={calculateFriendBalance(data, friend.id)} />
              <ChevronRight size={18} />
            </button>
          ))}
          {!data.friends.length ? <EmptyState icon={Users} text="No friends added." /> : null}
        </div>
      </section>
    </div>
  );
}

function AddFriendForm({
  existingEmails,
  onAddFriend
}: {
  existingEmails: string[];
  onAddFriend: (friend: Person) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail.includes("@")) {
      setError("Enter name and email.");
      return;
    }

    if (existingEmails.includes(trimmedEmail)) {
      setError("Friend already exists.");
      return;
    }

    onAddFriend({ id: makeId(), name: trimmedName, email: trimmedEmail });
    setName("");
    setEmail("");
    setError("");
  };

  return (
    <section className="tool-panel">
      <SectionHeader title="Add friend" icon={UserPlus} />
      <form className="form-grid" onSubmit={submit}>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} inputMode="email" />
        </label>
        {error ? <p className="form-error wide">{error}</p> : null}
        <button className="primary-button wide" type="submit">
          <Plus size={18} />
          Add friend
        </button>
      </form>
    </section>
  );
}

function FriendDetail({
  data,
  people,
  friend,
  onBack,
  onAddSettlement
}: {
  data: AppData;
  people: Person[];
  friend: Person;
  onBack: () => void;
  onAddSettlement: (settlement: Settlement) => void;
}) {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<Settlement["direction"]>("paid");
  const [note, setNote] = useState("");
  const balance = calculateFriendBalance(data, friend.id);
  const profile = data.profile!;
  const history = sortNewestFirst([
    ...data.expenses.filter(
      (expense) => expense.paidBy === friend.id || expense.splits.some((split) => split.userId === friend.id)
    ),
    ...data.settlements.filter((settlement) => settlement.friendId === friend.id)
  ]);

  useEffect(() => {
    setDirection(balance < 0 ? "paid" : "received");
  }, [balance]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseAmount(amount);

    if (parsed <= 0) return;

    onAddSettlement({
      id: makeId(),
      friendId: friend.id,
      direction,
      amount: roundToPaise(parsed),
      date: todayInputValue(),
      note: note.trim() || undefined
    });
    setAmount("");
    setNote("");
  };

  return (
    <div className="stack">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={18} />
        Friends
      </button>

      <section className={`balance-hero ${balanceTone(balance)}`}>
        <Avatar name={friend.name} large />
        <div>
          <p>{friend.email}</p>
          <strong>{balanceText(balance)}</strong>
        </div>
      </section>

      <section className="tool-panel">
        <SectionHeader title="Settle up" icon={HandCoins} />
        <form className="form-stack" onSubmit={submit}>
          <div className="segmented">
            <button type="button" className={direction === "paid" ? "active" : ""} onClick={() => setDirection("paid")}>
              I paid
            </button>
            <button
              type="button"
              className={direction === "received" ? "active" : ""}
              onClick={() => setDirection("received")}
            >
              They paid
            </button>
          </div>
          <label className="field">
            <span>Amount</span>
            <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
          </label>
          <label className="field">
            <span>Note</span>
            <input value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">
            <Check size={18} />
            Record settlement
          </button>
        </form>
      </section>

      <section className="section-block">
        <SectionHeader title="History" icon={Activity} />
        <div className="timeline">
          {history.map((item) =>
            "splits" in item ? (
              <ExpenseRow
                key={item.id}
                expense={item}
                tags={data.tags}
                people={people}
                viewerId={profile.id}
                focusUserId={friend.id}
              />
            ) : (
              <SettlementRow key={item.id} settlement={item} friend={friend} />
            )
          )}
          {!history.length ? <EmptyState icon={ReceiptText} text="No shared history." /> : null}
        </div>
      </section>
    </div>
  );
}
