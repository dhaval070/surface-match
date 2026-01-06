import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

const apiurl = import.meta.env.VITE_API_URL;

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function RinkReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [rink, setRink] = useState("");
    const [province, setProvince] = useState("");
    const [city, setCity] = useState("");
    const [provinces, setProvinces] = useState([]);
    const [site, setSite] = useState("");
    const [sites, setSites] = useState([]);

    const debouncedStartDate = useDebounce(startDate, 500);
    const debouncedEndDate = useDebounce(endDate, 500);
    const debouncedRink = useDebounce(rink, 500);
    const debouncedCity = useDebounce(city, 500);
    const debouncedSite = useDebounce(site, 500);

    const auth = useAuth();
    const api = auth.api;

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const resp = await api.get(`${apiurl}/provinces`);
                setProvinces(resp.data || []);
            } catch (err) {
                console.error("Error fetching provinces:", err);
            }
        };
        fetchProvinces();
    }, [api]);

    useEffect(() => {
        const fetchSites = async () => {
            try {
                const resp = await api.get(`${apiurl}/sites`);
                setSites(resp.data || []);
            } catch (err) {
                console.error("Error fetching sites:", err);
            }
        };
        fetchSites();
    }, [api]);

    useEffect(() => {
        setPage(1);
    }, [debouncedStartDate, debouncedEndDate, debouncedRink, debouncedCity, province, debouncedSite, perPage]);

    useEffect(() => {
        fetchReport();
    }, [page, perPage, debouncedStartDate, debouncedEndDate, debouncedRink, debouncedCity, province, debouncedSite, api]);

    const fetchReport = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page,
            perPage: perPage,
        });
        if (debouncedStartDate) params.append('start_date', debouncedStartDate);
        if (debouncedEndDate) params.append('end_date', debouncedEndDate);
        if (debouncedRink) params.append('rink', debouncedRink);
        if (province) params.append('province', province);
        if (debouncedSite) params.append('site', debouncedSite);
        if (debouncedCity) params.append('city', debouncedCity);

        try {
            const resp = await api.get(`${apiurl}/rink-report?${params.toString()}`);

            for (const d of resp.data.data) {
                let report = [];
                for (const site in d.json_report) {
                    report.push(site + ":" + d.json_report[site]);
                }
                d.report = report.join(", ");
            }

            setData(resp.data.data || []);
            setTotal(resp.data.total || 0);
            setPerPage(resp.data.perPage || 10);
        } catch (err) {
            console.error("Error fetching rink report:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setRink('');
        setProvince('');
        setCity('');
        setSite('');
        setPage(1);
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (debouncedStartDate) params.append('start_date', debouncedStartDate);
        if (debouncedEndDate) params.append('end_date', debouncedEndDate);
        if (debouncedRink) params.append('rink', debouncedRink);
        if (province) params.append('province', province);
        if (debouncedSite) params.append('site', debouncedSite);
        if (debouncedCity) params.append('city', debouncedCity);
        params.append('export', '1');
        const url = `${apiurl}/rink-report?${params.toString()}`;
        window.open(url, '_blank');
    };

    const totalPages = Math.ceil(total / perPage);

    return (
        <div className="App w-full">
            {loading && <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
                <div className="flex justify-center items-center mt-[50vh]">
                    <div className="fas fa-circle-notch fa-spin fa-5x text-violet-600"></div>
                </div>
            </div>}

            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-left">Rink Report</h1>
            </div>

            <div className="flex justify-between items-center my-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col gap-2">
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded-md"
                                placeholder="Start Date"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded-md"
                                placeholder="End Date"
                            />
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                            disabled={loading || (startDate === '' && endDate === '' && rink === '' && province === '' && city === '' && site === '')}
                        >
                            Clear Filters
                        </button>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Rink</label>
                            <input
                                type="text"
                                value={rink}
                                onChange={(e) => setRink(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded-md"
                                placeholder="Rink name"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Province</label>
                            <select
                                value={province}
                                onChange={e => setProvince(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded-md bg-white"
                            >
                                <option value="">All</option>
                                {provinces.map(p => (
                                    <option key={p.id} value={p.id}>{p.province_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">City</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded-md"
                                placeholder="City"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 items-center mt-2">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Site</label>
                            <select
                                value={site}
                                onChange={e => setSite(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded-md bg-white"
                            >
                                <option value="">All</option>
                                {sites.map(s => (
                                    <option key={s.site_name} value={s.site_name}>{s.display_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm font-medium">Per Page:</label>
                    <select
                        id="pageSize"
                        value={perPage}
                        onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                        className="px-2 py-1 border border-gray-300 rounded-md bg-white"
                        disabled={loading}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md"
                        disabled={loading}
                    >
                        Export
                    </button>
                </div>
            </div>

            <div className="my-5">
                <table className="table-auto bg-gray-100 w-full">
                    <thead>
                        <tr className="bg-slate-300">
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Rink</th>
                            <th className="px-4 py-2">City</th>
                            <th className="px-4 py-2">Province</th>
                            <th className="px-4 py-2">Total Games</th>
                            <th className="px-4 py-2">By Site</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => (
                            <tr key={idx} className="even:bg-gray-50 odd:bg-gray-200">
                                <td className="text-left px-4 py-2">{item.edate.substring(0, 10)}</td>
                                <td className="text-left px-4 py-2">{item.rink}</td>
                                <td className="text-left px-4 py-2">{item.city || "-"}</td>
                                <td className="text-left px-4 py-2">{item.province || "-"}</td>
                                <td className="text-left px-4 py-2">{item.total != null ? item.total : "-"}</td>
                                <td className="text-left px-4 py-2"><pre className="whitespace-pre-wrap">{
                                    // typeof item.json_report //.map((k, v) => k + ": " + v + " ")
                                    item.report
                                }</pre></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center my-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(1)}
                            disabled={page === 1 || loading}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            First
                        </button>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                    </div>
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                        <button
                            onClick={() => setPage(totalPages)}
                            disabled={page >= totalPages || loading}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Last
                        </button>
                    </div>
                </div>
            )}

            {data.length === 0 && !loading && (
                <p className="text-gray-600 text-center mt-4">No data found</p>
            )}
        </div>
    );
}
