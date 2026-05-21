export const todayInputValue = () => new Date().toISOString().slice(0, 10);

export const getMonthKey = (date: string) => date.slice(0, 7);

export const currentMonthKey = () => todayInputValue().slice(0, 7);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
