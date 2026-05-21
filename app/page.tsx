"use client";

import { BadgeIndianRupee } from "lucide-react";
import { usePersistentAppData } from "./hooks/use-persistent-app-data";
import { useServiceWorker } from "./hooks/use-service-worker";
import { AuthScreen } from "./screens/auth-screen";
import { Workspace } from "./workspace";

export default function ExpenseApp() {
  const { data, hydrated, resetData, setProfile, updateData } = usePersistentAppData();
  useServiceWorker();

  if (!hydrated) {
    return (
      <main className="loading-screen">
        <BadgeIndianRupee size={36} />
        <span>Opening SettleSpace</span>
      </main>
    );
  }

  if (!data.profile) {
    return <AuthScreen onLogin={setProfile} />;
  }

  return <Workspace data={data} updateData={updateData} onReset={resetData} />;
}
