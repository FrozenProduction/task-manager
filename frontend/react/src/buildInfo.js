// buildInfo.js — single source of truth for the version + last-deployed badge shown in the Footer.
// Update deployedAt in each release commit so the footer reflects when the build hit production.
export const buildInfo = {
  version: "1.0.0",
  // ISO date the build went live (yyyy-mm-dd, UTC). Update this in each release commit.
  deployedAt: "2026-09-09",
  repo: "https://github.com/FrozenProduction/task-manager",
  live: "https://taskmanagerapp-tau.vercel.app",
};
