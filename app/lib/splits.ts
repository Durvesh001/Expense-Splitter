import type { ExpenseSplit, SplitType } from "../types";
import { formatMoney, parseAmount, roundToPaise } from "./money";

export type SplitPreviewResult = {
  splits: ExpenseSplit[];
  error: string;
};

export function buildEqualSplits(amount: number, participantIds: string[]) {
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / participantIds.length);
  const remainder = cents - base * participantIds.length;

  return participantIds.map((userId, index) => ({
    userId,
    amount: (base + (index < remainder ? 1 : 0)) / 100
  }));
}

export function buildDraftSplitValues(splitType: SplitType, participantIds: string[], amount: number) {
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

export function calculateSplitPreview({
  amount,
  participantIds,
  splitType,
  splitValues
}: {
  amount: number;
  participantIds: string[];
  splitType: SplitType;
  splitValues: Record<string, string>;
}): SplitPreviewResult {
  if (amount <= 0 || participantIds.length === 0) return { splits: [], error: "" };

  if (splitType === "equal") {
    return { splits: buildEqualSplits(amount, participantIds), error: "" };
  }

  if (splitType === "exact") {
    const splits = participantIds.map((userId) => ({
      userId,
      amount: roundToPaise(parseAmount(splitValues[userId] ?? "0"))
    }));
    const total = roundToPaise(splits.reduce((sum, split) => sum + split.amount, 0));

    return {
      splits,
      error: Math.abs(total - amount) > 0.01 ? `Exact splits total ${formatMoney(total, true)}.` : ""
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
    amount: roundToPaise((amount * split.percentage) / 100)
  }));
  const adjustment = roundToPaise(amount - rawSplits.reduce((sum, split) => sum + split.amount, 0));
  const adjustedSplits = rawSplits.map((split, index) =>
    index === rawSplits.length - 1 ? { ...split, amount: roundToPaise(split.amount + adjustment) } : split
  );

  return {
    splits: adjustedSplits,
    error: Math.abs(totalPercent - 100) > 0.01 ? `Percentages total ${totalPercent}%.` : ""
  };
}
