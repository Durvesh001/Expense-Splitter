import type { SpendTag } from "./types";

export const STORAGE_KEY = "settlespace-data-v1";

export const TAG_COLORS = ["#0f766e", "#e11d48", "#2563eb", "#f59e0b", "#7c3aed", "#16a34a"];

export const DEFAULT_TAGS: SpendTag[] = [
  { id: "groceries", name: "Groceries", color: "#0f766e" },
  { id: "rent", name: "Rent", color: "#2563eb" },
  { id: "personal", name: "Personal", color: "#7c3aed" },
  { id: "health", name: "Health", color: "#e11d48" },
  { id: "travel", name: "Travel", color: "#f59e0b" },
  { id: "food", name: "Food", color: "#16a34a" }
];
