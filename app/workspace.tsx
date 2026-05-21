"use client";

import { useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import { BottomNav } from "./components/bottom-nav";
import { ActivityScreen } from "./screens/activity-screen";
import { AddExpenseScreen } from "./screens/add-expense-screen";
import { FriendsScreen } from "./screens/friends-screen";
import { HomeScreen } from "./screens/home-screen";
import { TagsScreen } from "./screens/tags-screen";
import type { AppData, Expense, Person, Settlement, SpendTag, Tab } from "./types";

export function Workspace({
  data,
  updateData,
  onReset
}: {
  data: AppData;
  updateData: (updater: (current: AppData) => AppData) => void;
  onReset: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const profile = data.profile!;
  const people = useMemo(() => [profile, ...data.friends], [profile, data.friends]);

  const addFriend = (friend: Person) => {
    updateData((current) => {
      const exists = current.friends.some((item) => item.email.toLowerCase() === friend.email.toLowerCase());
      if (exists) return current;
      return { ...current, friends: [...current.friends, friend] };
    });
  };

  const addExpense = (expense: Expense) => {
    updateData((current) => ({ ...current, expenses: [expense, ...current.expenses] }));
    setActiveTab("activity");
  };

  const addTag = (tag: SpendTag) => {
    updateData((current) => ({ ...current, tags: [...current.tags, tag] }));
  };

  const updateTagBudget = (tagId: string, budget?: number) => {
    updateData((current) => ({
      ...current,
      tags: current.tags.map((tag) => (tag.id === tagId ? { ...tag, budget } : tag))
    }));
  };

  const addSettlement = (settlement: Settlement) => {
    updateData((current) => ({ ...current, settlements: [settlement, ...current.settlements] }));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">SettleSpace</p>
          <h1>{tabTitle(activeTab, selectedFriendId ? data.friends.find((item) => item.id === selectedFriendId)?.name : "")}</h1>
        </div>
        <button className="profile-pill" onClick={onReset} title="Sign out">
          <span>{profile.name.slice(0, 1).toUpperCase()}</span>
          <LogOut size={17} />
        </button>
      </header>

      <main className="screen">
        {activeTab === "home" ? (
          <HomeScreen
            data={data}
            people={people}
            onNavigate={setActiveTab}
            onSelectFriend={(id) => {
              setSelectedFriendId(id);
              setActiveTab("friends");
            }}
          />
        ) : null}

        {activeTab === "friends" ? (
          <FriendsScreen
            data={data}
            people={people}
            selectedFriendId={selectedFriendId}
            onSelectFriend={setSelectedFriendId}
            onAddFriend={addFriend}
            onAddSettlement={addSettlement}
          />
        ) : null}

        {activeTab === "add" ? (
          <AddExpenseScreen
            data={data}
            people={people}
            onAddExpense={addExpense}
            onJumpToFriends={() => setActiveTab("friends")}
          />
        ) : null}

        {activeTab === "tags" ? (
          <TagsScreen data={data} onAddTag={addTag} onUpdateTagBudget={updateTagBudget} />
        ) : null}

        {activeTab === "activity" ? <ActivityScreen data={data} people={people} /> : null}
      </main>

      <BottomNav
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          if (tab !== "friends") setSelectedFriendId(null);
        }}
      />
    </div>
  );
}

function tabTitle(tab: Tab, friendName?: string) {
  if (friendName) return friendName;
  if (tab === "home") return "Home";
  if (tab === "friends") return "Friends";
  if (tab === "add") return "Add expense";
  if (tab === "tags") return "Tags";
  return "Activity";
}
