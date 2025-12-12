import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import EventsDialog from "./EventsDialog";

const apiurl = import.meta.env.VITE_API_URL;

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function SurfaceReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [showEventsDialog, setShowEventsDialog] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [locationNameFilter, setLocationNameFilter] = useState('');

    const debouncedLocationNameFilter = useDebounce(locationNameFilter, 500);

    const auth = useAuth();
    const api = auth.api;

    useEffect(() => {
        setPage(1);
    }, [debouncedLocationNameFilter, perPage]);

    useEffect(() => {
        fetchReport();
    }, [page, perPage, debouncedLocationNameFilter, api]);

    const fetchReport = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page,
            perPage: perPage,
        });
        if (debouncedLocationNameFilter) {
            params.append('location_name', debouncedLocationNameFilter);
        }
        
        api.get(`${apiurl}/report?${params.toString()}`)
            .then((resp) => {
                setData(resp.data.data || []);
                setTotal(resp.data.total || 0);
                setPerPage(resp.data.perPage || 10);
            })
            .catch((error) => {
                console.error("Error fetching report:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const totalPages = Math.ceil(total / perPage);

    const handlePrevPage = () => {
        setPage(page => page - 1);
    };

    const handleNextPage = () => {
        setPage(page => page + 1);
    };

    const handleFirstPage = () => {
        setPage(1);
    };

    const handleLastPage = () => {
        setPage(totalPages);
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (debouncedLocationNameFilter) {
            params.append('location_name', debouncedLocationNameFilter);
        }
        const queryString = params.toString();
        const url = queryString ? `${apiurl}/report/download?${queryString}` : `${apiurl}/report/download`;
        window.open(url, '_blank');
    };

    const handleLocationClick = (item) => {
        console.log("Item clicked:", item);
        if (!item.location_id) {
            console.error("location_id is missing from report data");
            alert("Location ID is not available in the report data. Please ensure the backend includes location_id.");
            return;
        }
        setSelectedLocation({
            id: item.location_id,
            name: item.location_name,
            startDate: item.start_time,
            endDate: item.end_time
        });
        setShowEventsDialog(true);
    };

    const handleClearFilters = () => {
        setLocationNameFilter('');
        setPage(1);
    };

    return (
        <div className="App w-full">

        {loading &&
        <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
            <div className="flex justify-center items-center mt-[50vh]">
                <div className="fas fa-circle-notch fa-spin fa-5x text-violet-600"></div>
            </div>
        </div>
        }

            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-left">Surface Report</h1>
                <button
                    onClick={handleExport}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Export
                </button>
            </div>
            
            <div className="flex justify-between items-center my-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-4 items-center">
                    <input
                        type="text"
                        value={locationNameFilter}
                        onChange={e => setLocationNameFilter(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-md"
                        placeholder="Filter by location..."
                    />
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        disabled={loading || locationNameFilter === ''}
                    >
                        Clear Filters
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm font-medium">Per Page:</label>
                    <select
                        id="pageSize"
                        value={perPage}
                        onChange={e => {
                            setPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                        className="px-2 py-1 border border-gray-300 rounded-md bg-white"
                        disabled={loading}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>
            
            <div className="my-5">
                <table className="table-auto bg-gray-100 w-full">
                    <thead className="sticky top-0">
                        <tr className="bg-slate-300">
                            <th className="px-4 py-2">Surface ID</th>
                            <th className="px-4 py-2">Location</th>
                            <th className="px-4 py-2">Surface Name</th>
                            <th className="px-4 py-2">DOW</th>
                            <th className="px-4 py-2">Start Time</th>
                            <th className="px-4 py-2">End Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index} className="even:bg-gray-50 odd:bg-gray-200">
                                <td className="text-left px-4 py-2">{item.surface_id}</td>
                                <td className="text-left px-4 py-2">
                                    <button
                                        onClick={() => handleLocationClick(item)}
                                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                    >
                                        {item.location_name}
                                    </button>
                                </td>
                                <td className="text-left px-4 py-2">{item.surface_name}</td>
                                <td className="text-left px-4 py-2">{item.day_of_week}</td>
                                <td className="text-left px-4 py-2">{new Date(item.start_time).toLocaleString()}</td>
                                <td className="text-left px-4 py-2">{new Date(item.end_time).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center my-4">
                    <div className="flex gap-2">
                        <button
                            onClick={handleFirstPage}
                            disabled={page === 1 || loading}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            First
                        </button>
                        <button
                            onClick={handlePrevPage}
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
                            onClick={handleNextPage}
                            disabled={page >= totalPages || loading}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                        <button
                            onClick={handleLastPage}
                            disabled={page >= totalPages || loading}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Last
                        </button>
                    </div>
                </div>
            )}

            {data.length === 0 && !loading &&
                <p className="text-gray-600 text-center mt-4">No data found</p>
            }

            {selectedLocation && (
                <EventsDialog
                    isOpen={showEventsDialog}
                    setIsOpen={setShowEventsDialog}
                    locationId={selectedLocation.id}
                    locationName={selectedLocation.name}
                    startDate={selectedLocation.startDate}
                    endDate={selectedLocation.endDate}
                    api={api}
                />
            )}
        </div>
    );
}
