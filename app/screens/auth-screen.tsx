"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { BadgeIndianRupee, Check } from "lucide-react";
import type { Person } from "../types";
import { makeId } from "../lib/ids";

export function AuthScreen({ onLogin }: { onLogin: (profile: Person) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail.includes("@")) {
      setError("Enter your name and email.");
      return;
    }

    onLogin({
      id: makeId(),
      name: trimmedName,
      email: trimmedEmail
    });
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-mark">
          <BadgeIndianRupee size={34} />
        </div>
        <div>
          <p className="eyebrow">SettleSpace</p>
          <h1>Split bills. Track spending.</h1>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit">
            <Check size={18} />
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
