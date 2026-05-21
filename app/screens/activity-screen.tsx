"use client";

import { Activity, Search } from "lucide-react";
import { ExpenseRow, SettlementRow } from "../components/activity-rows";
import { EmptyState } from "../components/ui";
import { sortNewestFirst } from "../lib/lookups";
import type { AppData, Person } from "../types";

export function ActivityScreen({ data, people }: { data: AppData; people: Person[] }) {
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
