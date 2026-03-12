export function formatDateTime(value?: string | null) {
  if (!value) return "n/a";

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeWindow(value?: string | null) {
  if (!value) return "sem data";

  const deltaMs = Date.now() - new Date(value).getTime();
  const deltaMinutes = Math.round(deltaMs / 60000);

  if (Math.abs(deltaMinutes) < 60) {
    return `${deltaMinutes} min`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 48) {
    return `${deltaHours} h`;
  }

  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays} d`;
}

export function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return "em curso";

  const deltaSeconds = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));

  if (deltaSeconds < 60) return `${deltaSeconds}s`;
  if (deltaSeconds < 3600) return `${Math.round(deltaSeconds / 60)}m`;

  return `${(deltaSeconds / 3600).toFixed(1)}h`;
}
