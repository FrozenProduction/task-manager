// Format a backend status enum value for display.
// Wire format stays TODO / IN_PROGRESS / DONE (Java enum + DB columns).
// Humans see "To Do" / "In Progress" / "Done".
export function formatStatus(status) {
  if (!status) return "";
  const map = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done",
  };
  return map[status] || status.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

// Stable color per status — used for the badge in task cards.
export function statusColor(status) {
  const colors = {
    TODO: "#9ca3af",
    IN_PROGRESS: "#3b82f6",
    DONE: "#10b981",
  };
  return colors[status] || "#9ca3af";
}

// Stable color per username — used for the avatar in <Header>.
export function avatarColor(name) {
  if (!name) return "#94a3b8";
  const palette = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#10b981", "#14b8a6",
    "#0ea5e9", "#3b82f6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

// Human date for timestamps: relative under 7 days ("3 days ago"),
// European absolute after that ("5 Sep 2026"). Never seconds.
// Pass-through for missing/invalid input so meta rows render nothing.
export function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  if (diffMs >= 0) {
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
