const RAW = import.meta.env.VITE_STATS_USERS;

const STATS_USERS = RAW
    ? RAW.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : null;

export function canViewStats(user) {
    if (!STATS_USERS) return true;
    return !!user && STATS_USERS.includes(user.toLowerCase());
}
