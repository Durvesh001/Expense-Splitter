# SettleSpace Code Map

This app is split by responsibility so each file answers one question.

## Entry and State

- `app/page.tsx` decides what to show first: loading screen, login screen, or the main workspace.
- `app/workspace.tsx` owns the active tab and the actions that change app data, such as adding friends, expenses, settlements, and tags.
- `app/hooks/use-persistent-app-data.ts` loads and saves the app data in `localStorage`.
- `app/hooks/use-service-worker.ts` registers the offline service worker.

## Shared Data Shape

- `app/types.ts` defines the main data models: `Person`, `Expense`, `Settlement`, `SpendTag`, `AppData`, and `Tab`.
- `app/constants.ts` stores fixed values such as default tags, tag colors, and the storage key.

## Business Logic

- `app/lib/app-data.ts` creates a fresh empty app state.
- `app/lib/balances.ts` calculates friend balances, monthly spend, tag spend, and balance labels.
- `app/lib/splits.ts` calculates equal, exact, and percentage expense splits.
- `app/lib/money.ts` formats rupee amounts and parses numeric input.
- `app/lib/dates.ts` formats dates and creates input-friendly date strings.
- `app/lib/lookups.ts` contains small list helpers for finding people, tags, and newest records.
- `app/lib/ids.ts` creates stable IDs for saved records.

## Screens

- `app/screens/auth-screen.tsx` handles first-time profile setup.
- `app/screens/home-screen.tsx` shows monthly spend, quick actions, tag spend, friends, and recent expenses.
- `app/screens/friends-screen.tsx` handles adding friends, viewing balances, friend history, and settlements.
- `app/screens/add-expense-screen.tsx` handles the expense form and split preview.
- `app/screens/tags-screen.tsx` handles tags and monthly budgets.
- `app/screens/activity-screen.tsx` shows the combined expense and settlement timeline.

## Reusable UI

- `app/components/ui.tsx` contains small shared UI pieces like avatars, section headers, empty states, metrics, and balance badges.
- `app/components/bottom-nav.tsx` contains the fixed bottom navigation.
- `app/components/activity-rows.tsx` renders expense rows, settlement rows, tag progress, and split previews.
- `app/components/budget-card.tsx` renders one editable budget card.

## Data Flow

1. `page.tsx` gets saved data from `usePersistentAppData`.
2. After login, `Workspace` receives `data` and an `updateData` function.
3. Screen files call callbacks like `onAddExpense` or `onAddFriend`.
4. `Workspace` updates the central `AppData`.
5. The persistence hook saves the updated `AppData` back to `localStorage`.
