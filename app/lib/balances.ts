import type { AppData, Expense } from "../types";
import { currentMonthKey, getMonthKey } from "./dates";
import { formatMoney, roundToPaise } from "./money";

export const getShare = (expense: Expense, userId: string) =>
  expense.splits.find((split) => split.userId === userId)?.amount ?? 0;

export function calculateFriendBalance(data: AppData, friendId: string) {
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

export function getTagSpend(data: AppData, userId: string, tagId: string, monthKey = currentMonthKey()) {
  return data.expenses.reduce((sum, expense) => {
    if (expense.tagId !== tagId || getMonthKey(expense.date) !== monthKey) return sum;
    return sum + getShare(expense, userId);
  }, 0);
}

export function getMonthlyTotal(data: AppData, userId: string, monthKey = currentMonthKey()) {
  return data.expenses.reduce((sum, expense) => {
    if (getMonthKey(expense.date) !== monthKey) return sum;
    return sum + getShare(expense, userId);
  }, 0);
}

export function balanceText(balance: number) {
  if (balance > 0) return `Owes you ${formatMoney(balance)}`;
  if (balance < 0) return `You owe ${formatMoney(balance)}`;
  return "Settled";
}

export function balanceTone(balance: number) {
  if (balance > 0) return "positive";
  if (balance < 0) return "negative";
  return "neutral";
}
