"use client";

import { Activity, Home, Plus, Tag, Users, type LucideIcon } from "lucide-react";
import type { Tab } from "../types";

const NAV_ITEMS: Array<{ tab: Tab; label: string; icon: LucideIcon }> = [
  { tab: "home", label: "Home", icon: Home },
  { tab: "friends", label: "Friends", icon: Users },
  { tab: "add", label: "Add", icon: Plus },
  { tab: "tags", label: "Tags", icon: Tag },
  { tab: "activity", label: "Activity", icon: Activity }
];

export function BottomNav({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map(({ tab, label, icon: Icon }) => (
        <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => onChange(tab)}>
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
