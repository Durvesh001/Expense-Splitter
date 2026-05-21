"use client";

import { Plus, ReceiptText, Tag, UserPlus, Users } from "lucide-react";
import { ExpenseRow, TagProgress } from "../components/activity-rows";
import { EmptyState, Metric, SectionHeader, Avatar, BalanceBadge } from "../components/ui";
import { calculateFriendBalance, getMonthlyTotal, getTagSpend } from "../lib/balances";
import { sortNewestFirst } from "../lib/lookups";
import { formatMoney } from "../lib/money";
import type { AppData, Person, Tab } from "../types";

export function HomeScreen({
  data,
  people,
  onNavigate,
  onSelectFriend
}: {
  data: AppData;
  people: Person[];
  onNavigate: (tab: Tab) => void;
  onSelectFriend: (friendId: string) => void;
}) {
  const profile = data.profile!;
  const monthSpend = getMonthlyTotal(data, profile.id);
  const balances = data.friends.map((friend) => ({
    friend,
    balance: calculateFriendBalance(data, friend.id)
  }));
  const owedToYou = balances.reduce((sum, item) => sum + Math.max(item.balance, 0), 0);
  const youOwe = balances.reduce((sum, item) => sum + Math.max(-item.balance, 0), 0);
  const latestExpenses = sortNewestFirst(data.expenses).slice(0, 4);

  return (
    <div className="stack">
      <section className="hero-band">
        <div>
          <p className="eyebrow">This month</p>
          <strong>{formatMoney(monthSpend)}</strong>
        </div>
        <div className="hero-metrics">
          <Metric label="Owed to you" value={formatMoney(owedToYou)} tone="positive" />
          <Metric label="You owe" value={formatMoney(youOwe)} tone="negative" />
        </div>
      </section>

      <section className="quick-actions">
        <button onClick={() => onNavigate("add")} className="action-button">
          <Plus size={20} />
          Add expense
        </button>
        <button onClick={() => onNavigate("friends")} className="action-button">
          <UserPlus size={20} />
          Add friend
        </button>
        <button onClick={() => onNavigate("tags")} className="action-button">
          <Tag size={20} />
          Budgets
        </button>
      </section>

      <section className="section-block">
        <SectionHeader title="Tag spend" icon={Tag} />
        <div className="tag-progress-list">
          {data.tags.map((tag) => {
            const spend = getTagSpend(data, profile.id, tag.id);
            if (!spend && !tag.budget) return null;
            return <TagProgress key={tag.id} tag={tag} spend={spend} />;
          })}
          {!data.tags.some((tag) => getTagSpend(data, profile.id, tag.id) || tag.budget) ? (
            <EmptyState icon={Tag} text="No tag spend yet." />
          ) : null}
        </div>
      </section>

      <section className="section-block">
        <SectionHeader title="Friends" icon={Users} />
        <div className="friend-list compact">
          {balances.map(({ friend, balance }) => (
            <button key={friend.id} className="friend-row" onClick={() => onSelectFriend(friend.id)}>
              <Avatar name={friend.name} />
              <div>
                <strong>{friend.name}</strong>
                <span>{friend.email}</span>
              </div>
              <BalanceBadge balance={balance} />
            </button>
          ))}
          {!balances.length ? <EmptyState icon={Users} text="Add friends to split bills." /> : null}
        </div>
      </section>

      <section className="section-block">
        <SectionHeader title="Recent" icon={ReceiptText} />
        <div className="timeline">
          {latestExpenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} tags={data.tags} people={people} viewerId={profile.id} />
          ))}
          {!latestExpenses.length ? <EmptyState icon={ReceiptText} text="No expenses recorded." /> : null}
        </div>
      </section>
    </div>
  );
}
