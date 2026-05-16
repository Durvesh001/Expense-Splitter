"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BadgeIndianRupee,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  HandCoins,
  Home,
  LogOut,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  Tag,
  UserPlus,
  Users,
  WalletCards,
  type LucideIcon
} from "lucide-react";

type Person = {
  id: string;
  name: string;
  email: string;
};

type SpendTag = {
  id: string;
  name: string;
  color: string;
  budget?: number;
  isCustom?: boolean;
};

type SplitType = "equal" | "exact" | "percentage";

type ExpenseSplit = {
  userId: string;
  amount: number;
  percentage?: number;
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  tagId: string;
  date: string;
  splitType: SplitType;
  splits: ExpenseSplit[];
  note?: string;
};

type Settlement = {
  id: string;
  friendId: string;
  direction: "paid" | "received";
  amount: number;
  date: string;
  note?: string;
};

type AppData = {
  profile: Person | null;
  friends: Person[];
  tags: SpendTag[];
  expenses: Expense[];
  settlements: Settlement[];
};

type Tab = "home" | "friends" | "add" | "tags" | "activity";

const STORAGE_KEY = "settlespace-data-v1";

const TAG_COLORS = ["#0f766e", "#e11d48", "#2563eb", "#f59e0b", "#7c3aed", "#16a34a"];

const DEFAULT_TAGS: SpendTag[] = [
  { id: "groceries", name: "Groceries", color: "#0f766e" },
  { id: "rent", name: "Rent", color: "#2563eb" },
  { id: "personal", name: "Personal", color: "#7c3aed" },
  { id: "health", name: "Health", color: "#e11d48" },
  { id: "travel", name: "Travel", color: "#f59e0b" },
  { id: "food", name: "Food", color: "#16a34a" }
];

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const createEmptyData = (): AppData => ({
  profile: null,
  friends: [],
  tags: DEFAULT_TAGS,
  expenses: [],
  settlements: []
});

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const preciseMoney = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

const formatMoney = (amount: number, precise = false) =>
  (precise ? preciseMoney : money).format(Math.abs(amount));

const parseAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToPaise = (value: number) => Math.round(value * 100) / 100;

const getMonthKey = (date: string) => date.slice(0, 7);

const currentMonthKey = () => todayInputValue().slice(0, 7);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));

const getShare = (expense: Expense, userId: string) =>
  expense.splits.find((split) => split.userId === userId)?.amount ?? 0;

const personName = (people: Person[], id: string) =>
  people.find((person) => person.id === id)?.name ?? "Unknown";

const tagById = (tags: SpendTag[], id: string) =>
  tags.find((tag) => tag.id === id) ?? tags[0];

const sortNewestFirst = <T extends { date: string }>(items: T[]) =>
  [...items].sort((a, b) => b.date.localeCompare(a.date));

function calculateFriendBalance(data: AppData, friendId: string) {
  if (!data.profile) return 0;

  const myId = data.profile.id;
  let balance = 0;

  for (const expense of data.expenses) {
    const myShare = getShare(expense, myId);
    const friendShare = getShare(expense, friendId);

    if (expense.paidBy === myId && friendShare > 0) {
      balance += friendShare;
    }

    if (expense.paidBy === friendId && myShare > 0) {
      balance -= myShare;
    }
  }

  for (const settlement of data.settlements.filter((item) => item.friendId === friendId)) {
    balance += settlement.direction === "paid" ? settlement.amount : -settlement.amount;
  }

  return roundToPaise(balance);
}

function getTagSpend(data: AppData, userId: string, tagId: string, monthKey = currentMonthKey()) {
  return data.expenses.reduce((sum, expense) => {
    if (expense.tagId !== tagId || getMonthKey(expense.date) !== monthKey) return sum;
    return sum + getShare(expense, userId);
  }, 0);
}

function getMonthlyTotal(data: AppData, userId: string, monthKey = currentMonthKey()) {
  return data.expenses.reduce((sum, expense) => {
    if (getMonthKey(expense.date) !== monthKey) return sum;
    return sum + getShare(expense, userId);
  }, 0);
}

function buildEqualSplits(amount: number, participantIds: string[]) {
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / participantIds.length);
  const remainder = cents - base * participantIds.length;

  return participantIds.map((userId, index) => ({
    userId,
    amount: (base + (index < remainder ? 1 : 0)) / 100
  }));
}

function buildDraftSplitValues(splitType: SplitType, participantIds: string[], amount: number) {
  if (!participantIds.length) return {};

  if (splitType === "percentage") {
    const base = roundToPaise(100 / participantIds.length);
    return Object.fromEntries(
      participantIds.map((id, index) => [
        id,
        index === participantIds.length - 1
          ? roundToPaise(100 - base * (participantIds.length - 1)).toString()
          : base.toString()
      ])
    );
  }

  const equalSplits = buildEqualSplits(amount, participantIds);
  return Object.fromEntries(equalSplits.map((split) => [split.userId, split.amount.toString()]));
}

function balanceText(balance: number) {
  if (balance > 0) return `Owes you ${formatMoney(balance)}`;
  if (balance < 0) return `You owe ${formatMoney(balance)}`;
  return "Settled";
}

function balanceTone(balance: number) {
  if (balance > 0) return "positive";
  if (balance < 0) return "negative";
  return "neutral";
}

export default function ExpenseApp() {
  const [data, setData] = useState<AppData>(createEmptyData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        setData(JSON.parse(stored) as AppData);
      } catch {
        setData(createEmptyData());
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      return;
    }

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => registrations.forEach((registration) => registration.unregister()))
      .catch(() => undefined);
  }, []);

  const updateData = (updater: (current: AppData) => AppData) => {
    setData((current) => updater(current));
  };

  if (!hydrated) {
    return (
      <main className="loading-screen">
        <BadgeIndianRupee size={36} />
        <span>Opening SettleSpace</span>
      </main>
    );
  }

  if (!data.profile) {
    return (
      <AuthScreen
        onLogin={(profile) =>
          updateData((current) => ({
            ...current,
            profile,
            tags: current.tags.length ? current.tags : DEFAULT_TAGS
          }))
        }
      />
    );
  }

  return <Workspace data={data} updateData={updateData} />;
}

function AuthScreen({ onLogin }: { onLogin: (profile: Person) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail.includes("@")) {
      setError("Enter your name and email.");
      return;
    }

    onLogin({
      id: makeId(),
      name: trimmedName,
      email: trimmedEmail
    });
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-mark">
          <BadgeIndianRupee size={34} />
        </div>
        <div>
          <p className="eyebrow">SettleSpace</p>
          <h1>Split bills. Track spending.</h1>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit">
            <Check size={18} />
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}

function Workspace({
  data,
  updateData
}: {
  data: AppData;
  updateData: (updater: (current: AppData) => AppData) => void;
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

  const resetApp = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    updateData(() => createEmptyData());
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">SettleSpace</p>
          <h1>{tabTitle(activeTab, selectedFriendId ? data.friends.find((item) => item.id === selectedFriendId)?.name : "")}</h1>
        </div>
        <button className="profile-pill" onClick={resetApp} title="Sign out">
          <span>{profile.name.slice(0, 1).toUpperCase()}</span>
          <LogOut size={17} />
        </button>
      </header>

      <main className="screen">
        {activeTab === "home" ? (
          <HomeScreen data={data} people={people} onNavigate={setActiveTab} onSelectFriend={(id) => {
            setSelectedFriendId(id);
            setActiveTab("friends");
          }} />
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
          <AddExpenseScreen data={data} people={people} onAddExpense={addExpense} onJumpToFriends={() => setActiveTab("friends")} />
        ) : null}

        {activeTab === "tags" ? (
          <TagsScreen data={data} onAddTag={addTag} onUpdateTagBudget={updateTagBudget} />
        ) : null}

        {activeTab === "activity" ? <ActivityScreen data={data} people={people} /> : null}
      </main>

      <BottomNav activeTab={activeTab} onChange={(tab) => {
        setActiveTab(tab);
        if (tab !== "friends") setSelectedFriendId(null);
      }} />
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

function HomeScreen({
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

function FriendsScreen({
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

function AddExpenseScreen({
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

  const peopleById = useMemo(
    () => Object.fromEntries(people.map((person) => [person.id, person])),
    [people]
  );

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

  const splitPreview = useMemo(() => {
    if (amountNumber <= 0 || participantIds.length === 0) return { splits: [], error: "" };

    if (splitType === "equal") {
      return { splits: buildEqualSplits(amountNumber, participantIds), error: "" };
    }

    if (splitType === "exact") {
      const splits = participantIds.map((userId) => ({
        userId,
        amount: roundToPaise(parseAmount(splitValues[userId] ?? "0"))
      }));
      const total = roundToPaise(splits.reduce((sum, split) => sum + split.amount, 0));
      return {
        splits,
        error: Math.abs(total - amountNumber) > 0.01 ? `Exact splits total ${formatMoney(total, true)}.` : ""
      };
    }

    const percentages = participantIds.map((userId) => ({
      userId,
      percentage: parseAmount(splitValues[userId] ?? "0")
    }));
    const totalPercent = roundToPaise(percentages.reduce((sum, split) => sum + split.percentage, 0));
    const rawSplits = percentages.map((split) => ({
      userId: split.userId,
      percentage: split.percentage,
      amount: roundToPaise((amountNumber * split.percentage) / 100)
    }));
    const adjustment = roundToPaise(amountNumber - rawSplits.reduce((sum, split) => sum + split.amount, 0));
    const adjustedSplits = rawSplits.map((split, index) =>
      index === rawSplits.length - 1 ? { ...split, amount: roundToPaise(split.amount + adjustment) } : split
    );

    return {
      splits: adjustedSplits,
      error: Math.abs(totalPercent - 100) > 0.01 ? `Percentages total ${totalPercent}%.` : ""
    };
  }, [amountNumber, participantIds, splitType, splitValues]);

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
                    onChange={(event) =>
                      setSplitValues((current) => ({ ...current, [userId]: event.target.value }))
                    }
                    inputMode="decimal"
                    placeholder={splitType === "percentage" ? "%" : "₹"}
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

function SplitPreview({
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
    <div className="split-preview" style={{ "--tag-color": tag.color } as React.CSSProperties}>
      {splits.map((split) => (
        <div key={split.userId}>
          <span>{split.userId === profileId ? "You" : personName(people, split.userId)}</span>
          <strong>{formatMoney(split.amount, true)}</strong>
        </div>
      ))}
    </div>
  );
}

function TagsScreen({
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
                style={{ "--tag-color": item } as React.CSSProperties}
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

function BudgetCard({
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
    <article className="budget-card" style={{ "--tag-color": tag.color } as React.CSSProperties}>
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

function ActivityScreen({ data, people }: { data: AppData; people: Person[] }) {
  const profile = data.profile!;
  const timeline = sortNewestFirst([...data.expenses, ...data.settlements]);

  return (
    <div className="stack">
      <section className="section-block">
        <div className="search-shell">
          <Search size={18} />
          <span>{timeline.length} records</span>
        </div>
        <div className="timeline">
          {timeline.map((item) =>
            "splits" in item ? (
              <ExpenseRow key={item.id} expense={item} tags={data.tags} people={people} viewerId={profile.id} />
            ) : (
              <SettlementRow
                key={item.id}
                settlement={item}
                friend={data.friends.find((friend) => friend.id === item.friendId)}
              />
            )
          )}
          {!timeline.length ? <EmptyState icon={Activity} text="No activity yet." /> : null}
        </div>
      </section>
    </div>
  );
}

function ExpenseRow({
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
      <div className="tag-dot" style={{ "--tag-color": tag.color } as React.CSSProperties}>
        <ReceiptText size={18} />
      </div>
      <div>
        <strong>{expense.title}</strong>
        <span>
          {tag.name} · paid by {paidByName} · {formatDate(expense.date)}
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

function SettlementRow({
  settlement,
  friend
}: {
  settlement: Settlement;
  friend?: Person;
}) {
  return (
    <article className="timeline-row settlement">
      <div className="tag-dot settle-dot">
        <HandCoins size={18} />
      </div>
      <div>
        <strong>{settlement.direction === "paid" ? "You paid" : "You received"}</strong>
        <span>
          {friend?.name ?? "Friend"} · {formatDate(settlement.date)}
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

function TagProgress({ tag, spend }: { tag: SpendTag; spend: number }) {
  const percent = tag.budget ? Math.min((spend / tag.budget) * 100, 100) : 0;
  const isOver = tag.budget ? spend > tag.budget : false;

  return (
    <article className="tag-progress" style={{ "--tag-color": tag.color } as React.CSSProperties}>
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

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
}) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="section-header">
      <Icon size={18} />
      <h2>{title}</h2>
    </div>
  );
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return <span className={large ? "avatar large" : "avatar"}>{name.slice(0, 1).toUpperCase()}</span>;
}

function BalanceBadge({ balance }: { balance: number }) {
  return <span className={`balance-badge ${balanceTone(balance)}`}>{balanceText(balance)}</span>;
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="empty-state">
      <Icon size={22} />
      <span>{text}</span>
    </div>
  );
}

function BottomNav({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<{ tab: Tab; label: string; icon: LucideIcon }> = [
    { tab: "home", label: "Home", icon: Home },
    { tab: "friends", label: "Friends", icon: Users },
    { tab: "add", label: "Add", icon: Plus },
    { tab: "tags", label: "Tags", icon: Tag },
    { tab: "activity", label: "Activity", icon: Activity }
  ];

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map(({ tab, label, icon: Icon }) => (
        <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => onChange(tab)}>
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
