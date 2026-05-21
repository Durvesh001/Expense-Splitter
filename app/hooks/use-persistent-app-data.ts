"use client";

import { useEffect, useState } from "react";
import { DEFAULT_TAGS, STORAGE_KEY } from "../constants";
import { createEmptyData } from "../lib/app-data";
import type { AppData } from "../types";

export function usePersistentAppData() {
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

  const updateData = (updater: (current: AppData) => AppData) => {
    setData((current) => updater(current));
  };

  const resetData = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setData(createEmptyData());
  };

  const setProfile = (profile: NonNullable<AppData["profile"]>) => {
    updateData((current) => ({
      ...current,
      profile,
      tags: current.tags.length ? current.tags : DEFAULT_TAGS
    }));
  };

  return {
    data,
    hydrated,
    resetData,
    setProfile,
    updateData
  };
}
