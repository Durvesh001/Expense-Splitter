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

export const formatMoney = (amount: number, precise = false) =>
  (precise ? preciseMoney : money).format(Math.abs(amount));

export const parseAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const roundToPaise = (value: number) => Math.round(value * 100) / 100;
