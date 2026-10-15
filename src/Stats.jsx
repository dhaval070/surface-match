import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "./AuthProvider";

const apiurl = import.meta.env.VITE_API_URL;

// todayET returns today's date in America/Toronto as YYYY-MM-DD, used to build
// the Events deep-links so they line up with the server's ET "today".
const todayET = () =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });

function KpiCard({ label, value, subtext, accent, barPct, onClick, topBorder }) {
    const accentText = accent === "red" ? "text-red-600" : "text-gray-900";
    const borderColor =
        topBorder === "blue"
            ? "border-blue-600"
            : topBorder === "green"
              ? "border-green-500"
              : topBorder === "red"
                ? "border-red-600"
                : "";
    const borderClass = topBorder ? `border-t-[5px] ${borderColor}` : "";
    const body = (
        <>
            <div className="text-sm font-bold text-gray-500">{label}</div>
            <div className={`mt-1 text-3xl font-bold ${accentText}`}>{value}</div>
            {subtext && <div className="mt-1 text-xs text-gray-500">{subtext}</div>}
            {barPct !== undefined && (
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${Math.min(Math.max(barPct, 0), 100)}%` }}
                    ></div>
                </div>
            )}
        </>
    );
    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={`text-left w-full bg-white rounded-lg shadow p-4 hover:ring-2 hover:ring-blue-300 cursor-pointer ${borderClass}`}
            >
                {body}
            </button>
        );
    }
    return <div className={`bg-white rounded-lg shadow p-4 ${borderClass}`}>{body}</div>;
}

KpiCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    subtext: PropTypes.string,
    accent: PropTypes.string,
    barPct: PropTypes.number,
    onClick: PropTypes.func,
    topBorder: PropTypes.string,
};

export default function Stats() {
    const [data, setData] = useState(null);
    const [parserTypes, setParserTypes] = useState([]);
    const [siteType, setSiteType] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const auth = useAuth();
    const api = auth.api;
    const navigate = useNavigate();

    useEffect(() => {
        api.get(`${apiurl}/parser-types`)
            .then((resp) => setParserTypes(resp.data || []))
            .catch((e) => console.error("Error fetching parser types:", e));
    }, [api]);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await api.get(`${apiurl}/stats`, {
                params: siteType === "All" ? {} : { site_type: siteType },
            });
            setData(resp.data);
        } catch (e) {
            console.error("Error fetching stats:", e);
            setError("Failed to load stats.");
        } finally {
            setLoading(false);
        }
    }, [api, siteType]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const gs = data?.gamesheet;
    const today = todayET();

    const claimErrorsLink = `/events?claim_status=error&start_date=${today}&end_date=${today}`;

    return (
        <div className="App w-full">
            {loading && (
                <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
                    <div className="flex justify-center items-center mt-[50vh]">
                        <div className="fas fa-circle-notch fa-spin fa-5x text-violet-600"></div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Stats</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Site type</label>
                        <select
                            value={siteType}
                            onChange={(e) => setSiteType(e.target.value)}
                            className="rounded border-solid outline outline-gray-400 outline-2 w-56"
                            disabled={loading}
                        >
                            <option value="All">All</option>
                            <option value="GameSheet">GameSheet</option>
                            {parserTypes.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                    {data?.as_of && (
                        <span className="text-sm text-gray-500">As of {data.as_of}</span>
                    )}
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {error && <div className="text-red-600 mb-4">{error}</div>}

            {data && (
                <>
                    {/* Section 1 - All active seasons/leagues */}
                    <h2 className="text-lg font-semibold mb-2 text-left">All active seasons / leagues</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <KpiCard
                            label="Active seasons / leagues"
                            value={data.site_count}
                            subtext={`of ${data.site_count} sites · ${data.gamesheet_count} GameSheet`}
                            topBorder="blue"
                        />
                        <KpiCard
                            label="Total games"
                            value={data.total_games}
                            subtext="across active seasons"
                            topBorder="blue"
                        />
                        <KpiCard
                            label="Games loaded today"
                            value={data.games_loaded_today}
                            subtext="new imports only"
                            topBorder="blue"
                        />
                        <KpiCard
                            label="Upcoming"
                            value={data.upcoming_today}
                            topBorder="blue"
                        />
                    </div>

                    {/* Section 2 - GameSheet imports */}
                    {gs && (
                        <>
                            <h2 className="text-lg font-semibold mb-2 text-left">GameSheet imports</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <KpiCard
                                    label="Claimed today"
                                    value={gs.claimed_today}
                                    subtext={`of ${gs.games_today} GameSheet games today (${gs.claimed_today_pct}%)`}
                                    barPct={gs.claimed_today_pct}
                                    topBorder="green"
                                />
                                <KpiCard
                                    label="Claimed games to date"
                                    value={gs.claimed_season}
                                    subtext={`of ${gs.season_games} games (${gs.claimed_season_pct}%)`}
                                    barPct={gs.claimed_season_pct}
                                    topBorder="green"
                                />
                                <KpiCard
                                    label="Upcoming, not yet claimed"
                                    value={gs.upcoming_not_claimed}
                                    subtext="next 7 days"
                                    topBorder="green"
                                />
                                <KpiCard
                                    label="Claim errors today"
                                    value={gs.claim_errors_today}
                                    accent="red"
                                    onClick={() => navigate(claimErrorsLink)}
                                    topBorder="red"
                                />
                            </div>
                        </>
                    )}

                    {/* Section 3 - Per-season breakdown */}
                    <StatsTable rows={data.sites || []} navigate={navigate} />
                </>
            )}
        </div>
    );
}

function StatsTable({ rows, navigate }) {
    const [sortColumn, setSortColumn] = useState("loaded_today");
    const [sortOrder, setSortOrder] = useState("desc");

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortColumn(column);
            setSortOrder("desc");
        }
    };

    const sortIndicator = (column) => {
        if (sortColumn !== column) return "";
        return sortOrder === "asc" ? " ▲" : " ▼";
    };

    const sorted = useMemo(() => {
        const copy = [...rows];
        const dir = sortOrder === "asc" ? 1 : -1;
        copy.sort((a, b) => {
            if (sortColumn === "site" || sortColumn === "display_name") {
                return dir * a[sortColumn].localeCompare(b[sortColumn]);
            }
            if (sortColumn === "parser_type") {
                return dir * a.parser_type.localeCompare(b.parser_type);
            }
            // numeric columns; null claimed values sort last
            const av = a[sortColumn];
            const bv = b[sortColumn];
            if (av === null && bv === null) return 0;
            if (av === null) return 1;
            if (bv === null) return -1;
            return dir * (av - bv);
        });
        return copy;
    }, [rows, sortColumn, sortOrder]);

    const numHeader = (column, label) => (
        <th
            onClick={() => handleSort(column)}
            className="px-4 py-2 cursor-pointer select-none"
        >
            {label}
            {sortIndicator(column)}
        </th>
    );

    return (
        <>
            <h2 className="text-lg font-semibold mb-2">Per-season breakdown</h2>
            <div className="overflow-x-auto">
                <table className="table-auto w-full bg-gray-100">
                    <thead className="sticky top-0">
                        <tr className="bg-slate-300">
                            <th
                                onClick={() => handleSort("display_name")}
                                className="px-4 py-2 cursor-pointer select-none text-left"
                            >
                                Season / league{sortIndicator("display_name")}
                            </th>
                            <th
                                onClick={() => handleSort("parser_type")}
                                className="px-4 py-2 cursor-pointer select-none text-left"
                            >
                                Type{sortIndicator("parser_type")}
                            </th>
                            {numHeader("total_games", "Total games")}
                            {numHeader("loaded_today", "Loaded today")}
                            {numHeader("upcoming", "Upcoming")}
                            {numHeader("claimed_today", "Claimed today")}
                            {numHeader("claimed_season", "Claimed season")}
                            <th className="px-4 py-2 text-left">Last scraped</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                                    No active seasons match this filter.
                                </td>
                            </tr>
                        )}
                        {sorted.map((r) => (
                            <tr key={r.site} className="even:bg-gray-50 odd:bg-gray-200">
                                <td className="px-4 py-2 text-left">
                                    <button
                                        onClick={() =>
                                            navigate(`/events?site=${encodeURIComponent(r.site)}`)
                                        }
                                        className="text-blue-600 hover:underline text-left"
                                    >
                                        {r.display_name}
                                    </button>
                                    <div className="text-xs text-gray-500">{r.site}</div>
                                </td>
                                <td className="px-4 py-2 text-left">
                                    {r.is_gamesheet && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
                                            GameSheet
                                        </span>
                                    )}
                                    {!r.is_gamesheet && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">
                                            {r.parser_type}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-2">{r.total_games}</td>
                                <td className="px-4 py-2">{r.loaded_today}</td>
                                <td className="px-4 py-2">{r.upcoming}</td>
                                <td className="px-4 py-2">
                                    {r.is_gamesheet ? r.claimed_today : "–"}
                                </td>
                                <td className="px-4 py-2">
                                    {r.is_gamesheet ? r.claimed_season : "–"}
                                </td>
                                <td className="px-4 py-2">{r.last_scraped_at || "–"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

StatsTable.propTypes = {
    rows: PropTypes.array.isRequired,
    navigate: PropTypes.func.isRequired,
};
