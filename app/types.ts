export type Person = {
  id: string;
  name: string;
  email: string;
};

export type SpendTag = {
  id: string;
  name: string;
  color: string;
  budget?: number;
  isCustom?: boolean;
};

export type SplitType = "equal" | "exact" | "percentage";

export type ExpenseSplit = {
  userId: string;
  amount: number;
  percentage?: number;
};

export type Expense = {
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

export type Settlement = {
  id: string;
  friendId: string;
  direction: "paid" | "received";
  amount: number;
  date: string;
  note?: string;
};

export type AppData = {
  profile: Person | null;
  friends: Person[];
  tags: SpendTag[];
  expenses: Expense[];
  settlements: Settlement[];
};

export type Tab = "home" | "friends" | "add" | "tags" | "activity";

export type Tone = "positive" | "negative" | "neutral";
