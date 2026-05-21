import { DEFAULT_TAGS } from "../constants";
import type { AppData } from "../types";

export const createEmptyData = (): AppData => ({
  profile: null,
  friends: [],
  tags: DEFAULT_TAGS,
  expenses: [],
  settlements: []
});
