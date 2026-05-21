import type { Person, SpendTag } from "../types";

export const personName = (people: Person[], id: string) =>
  people.find((person) => person.id === id)?.name ?? "Unknown";

export const tagById = (tags: SpendTag[], id: string) =>
  tags.find((tag) => tag.id === id) ?? tags[0];

export const sortNewestFirst = <T extends { date: string }>(items: T[]) =>
  [...items].sort((a, b) => b.date.localeCompare(a.date));
