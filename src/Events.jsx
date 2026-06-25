import { useState, useEffect } from 'react'
import './App.css'
import { Field, Label, Select, Button } from '@headlessui/react'
import { useAuth } from './AuthProvider.jsx'
import { useSearchParams } from 'react-router-dom'
import SurfaceDialog from './surface-dialog.jsx'

const apiurl = import.meta.env.VITE_API_URL

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

export default function Events() {
    const [events, setEvents] = useState([])
    const [isBusy, setBusy] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState(null)
    const [pageSize, setPageSize] = useState(10)
    const [searchParams] = useSearchParams()
    const [site, setSite] = useState(searchParams.get('site') || "")
    const [allSites, setAllSites] = useState([])
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [showSurfaceDialog, setShowSurfaceDialog] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [selectedSurfaceId, setSelectedSurfaceId] = useState(null)
    const [apiMessage, setApiMessage] = useState(null)
    const [claimStatus, setClaimStatus] = useState("")
    const [claimErrorPopup, setClaimErrorPopup] = useState(null)

    const debouncedSite = useDebounce(site, 500);
    const debouncedStartDate = useDebounce(startDate, 500);
    const debouncedEndDate = useDebounce(endDate, 500);

    const auth = useAuth()
    const api = auth.api

    useEffect(function() {
        setBusy(true)
        api.get(apiurl + "/sites").then((resp) => {
            setAllSites(resp.data)
        }).finally(() => setBusy(false))
    }, [api])

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSite, debouncedStartDate, debouncedEndDate, pageSize, claimStatus]);

    useEffect(function() {
        setBusy(true)
        const params = new URLSearchParams({
            page: currentPage,
            perPage: pageSize,
        });
        if (debouncedSite) {
            params.append('site', debouncedSite);
        }
        if (debouncedStartDate) {
            params.append('start_date', debouncedStartDate);
        }
        if (debouncedEndDate) {
            params.append('end_date', debouncedEndDate);
        }
        if (claimStatus) {
            params.append('claim_status', claimStatus);
        }

        api.get(`${apiurl}/events?${params.toString()}`).then((resp) => {
            setEvents(resp.data.data)
            setPagination(resp.data)
        }).catch(e => {
            console.error("API Error:", e)
        }).finally(() => setBusy(false))
    }, [api, currentPage, pageSize, debouncedSite, debouncedStartDate, debouncedEndDate, claimStatus]);

    const handleSetSurface = (event) => {
        setSelectedEvent(event);
        setShowSurfaceDialog(true);
    };

    // eslint-disable-next-line no-unused-vars
    const surfaceSelected = (surfaceId, _eventData) => {
        setShowSurfaceDialog(false);
        setSelectedSurfaceId(surfaceId);
        setShowConfirmDialog(true);
    };

    const handleUpdateSurface = (updateFuture) => {
        setShowConfirmDialog(false);
        setBusy(true);

        api.put(`${apiurl}/events/${selectedEvent.id}`, {
            surface_id: selectedSurfaceId,
            update_future: updateFuture
        }).then((resp) => {
            if (resp.data && resp.data.message) {
                setApiMessage(resp.data.message);
                setTimeout(() => setApiMessage(null), 5000);
            }
            // Refresh events list
            const params = new URLSearchParams({
                page: currentPage,
                perPage: pageSize,
            });
            if (debouncedSite) {
                params.append('site', debouncedSite);
            }
            if (debouncedStartDate) {
                params.append('start_date', debouncedStartDate);
            }
            if (debouncedEndDate) {
                params.append('end_date', debouncedEndDate);
            }
            if (claimStatus) {
                params.append('claim_status', claimStatus);
            }
            return api.get(`${apiurl}/events?${params.toString()}`);
        }).then((resp) => {
            if (resp) {
                setEvents(resp.data.data);
                setPagination(resp.data);
            }
        }).catch(e => {
            console.error("API Error:", e);
            if (e.response && e.response.data && e.response.data.message) {
                setApiMessage(e.response.data.message);
                setTimeout(() => setApiMessage(null), 5000);
            }
        }).finally(() => setBusy(false));
    };

    const handleUnsetSurface = (event) => {
        setSelectedEvent(event);
        setSelectedSurfaceId(0);
        setShowConfirmDialog(true);
    };

    let rows = []

    if (events.length > 0) {
        console.log("First event object keys:", Object.keys(events[0]))
        rows = events.map((r, index) => (
            <tr key={r.id || index} className="even:bg-gray-50 odd:bg-gray-200">
                <td className="text-left px-4 py-2">
                    <span>{r.id}</span>
                    {r.event_id && r.event_id !== '' && r.event_id != 0 && (
                        <>
                            <br />
                            <span
                                className={r.claim_status === 1 ? 'text-green-600 font-bold' : r.claim_status === 0 ? 'text-red-600 font-bold cursor-pointer' : ''}
                                onClick={() => r.claim_status === 0 ? setClaimErrorPopup(r) : null}
                            >
                                {r.event_id}
                            </span>
                        </>
                    )}
                </td>
                <td className="text-left px-4 py-2">{r.site}</td>
                <td className="text-left px-4 py-2">{r.datetime}</td>
                <td className="text-left px-4 py-2">{r.home_team}</td>
                <td className="text-left px-4 py-2">{r.guest_team}</td>
                <td className="text-left px-4 py-2">{r.location}</td>
                <td className="text-left px-4 py-2">{r.division}</td>
                <td className="text-left px-4 py-2">{r.surface_id}</td>
                <td className="text-left px-4 py-2 whitespace-nowrap w-48">
                    <Button
                        className="rounded bg-sky-600 py-2 px-2 text-xs text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700"
                        onClick={() => handleSetSurface(r)}
                        title="Update Surface"
                    >
                        Change
                    </Button>
                    &nbsp;&nbsp;
                    {r.surface_id != 0 &&
                        <Button
                            className="rounded bg-emerald-600 py-2 px-2 text-xs text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700"
                            onClick={() => handleUnsetSurface(r)}
                            title="Unset Surface"
                        >
                            Unset
                        </Button>
                    }
                </td>
            </tr>
        ))
    }

    const handlePrevPage = () => {
        setCurrentPage(page => page - 1);
    };

    const handleNextPage = () => {
        setCurrentPage(page => page + 1);
    };

    const handleFirstPage = () => {
        setCurrentPage(1);
    };

    const handleLastPage = () => {
        setCurrentPage(totalPages);
    };

    const handleClearFilters = () => {
        setSite('');
        setStartDate('');
        setEndDate('');
        setClaimStatus('');
        setCurrentPage(1);
    };

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1;

    let options = []
    if (allSites.length > 0) {
        options = allSites.map((r) => (
            <option key={r.site_name} value={r.site_name}>{r.display_name} ({r.site_name})</option>
        ))
    }

    const handleExport = () => {
        const params = new URLSearchParams();
        if (debouncedStartDate) params.append('start_date', debouncedStartDate);
        if (debouncedEndDate) params.append('end_date', debouncedEndDate);
        if (debouncedSite) params.append('site', debouncedSite);
        if (claimStatus) params.append('claim_status', claimStatus);
        params.append('export', '1');
        const url = `${apiurl}/events?${params.toString()}`;
        window.open(url, '_blank');
    };

    return (
        <div className="App w-full">

            {isBusy &&
                <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
                    <div className="flex justify-center items-center mt-[50vh]">
                        <div className="fas fa-circle-notch fa-spin fa-5x text-violet-600"></div>
                    </div>
                </div>
            }

            <SurfaceDialog
                province="Ontario"
                api={api}
                isOpen={showSurfaceDialog}
                siteLoc={selectedEvent ? { location: selectedEvent.location } : null}
                setIsOpen={setShowSurfaceDialog}
                surfaceSelected={surfaceSelected}
            />

            {showConfirmDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
                        <h3 className="text-lg font-bold mb-4">Update Future Events?</h3>
                        <p className="mb-6">Do you want to update future events for this location as well?</p>
                        <div className="flex gap-4 justify-end">
                            <Button
                                className="rounded bg-gray-300 py-2 px-4 text-sm text-gray-800 hover:bg-gray-400"
                                onClick={() => handleUpdateSurface(false)}
                            >
                                No, Only This Event
                            </Button>
                            <Button
                                className="rounded bg-blue-600 py-2 px-4 text-sm text-white hover:bg-blue-500"
                                onClick={() => handleUpdateSurface(true)}
                            >
                                Yes, Update Future Events
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {claimErrorPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
                        <h3 className="text-lg font-bold mb-4 text-red-600">Claim Error</h3>
                        <div className="mb-4 space-y-2">
                            <p><span className="font-medium">Error:</span> {claimErrorPopup.claim_error_message}</p>
                            <p><span className="font-medium">HTTP Status:</span> {claimErrorPopup.claim_http_status_code}</p>
                            <p><span className="font-medium">Created At:</span> {claimErrorPopup.claim_created_at}</p>
                            <p><span className="font-medium">Updated At:</span> {claimErrorPopup.claim_updated_at}</p>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                className="rounded bg-gray-300 py-2 px-4 text-sm text-gray-800 hover:bg-gray-400"
                                onClick={() => setClaimErrorPopup(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {apiMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    {apiMessage}
                </div>
            )}

            <h1 className="text-xl font-bold text-left mb-4">Events</h1>

            <div className="flex justify-between items-center my-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-4 items-center flex-wrap">
                    <Field>
                        <div className="flex justify-start items-center gap-2">
                            <Label className="text-sm/6 font-medium">Site</Label>
                            <Select
                                onChange={(e) => setSite(e.currentTarget.value)}
                                value={site}
                                className="rounded border-solid outline outline-gray-400 outline-2 w-64"
                                disabled={isBusy}
                            >
                                <option value="">All Sites</option>
                                {options}
                            </Select>
                            {site && <span className="ml-4 text-sm font-medium">Selected: {site}</span>}
                        </div>
                    </Field>
                    <Field>
                        <div className="flex justify-start items-center gap-2">
                            <Label className="text-sm/6 font-medium">Date Range</Label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded-md"
                                disabled={isBusy}
                                placeholder="Start Date"
                            />
                            <span className="text-sm font-medium">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded-md"
                                disabled={isBusy}
                                placeholder="End Date"
                            />
                        </div>
                    </Field>
                    <Field>
                        <div className="flex justify-start items-center gap-2">
                            <Label className="text-sm/6 font-medium">Claim Status</Label>
                            <Select
                                onChange={(e) => setClaimStatus(e.currentTarget.value)}
                                value={claimStatus}
                                className="rounded border-solid outline outline-gray-400 outline-2 w-40"
                                disabled={isBusy}
                            >
                                <option value="">All</option>
                                <option value="success">Claimed</option>
                                <option value="error">Claim Error</option>
                            </Select>
                        </div>
                    </Field>
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        disabled={isBusy || (site === '' && startDate === '' && endDate === '' && claimStatus === '')}
                    >
                        Clear Filters
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm font-medium">Per Page:</label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={e => {
                            setPageSize(Number(e.target.value));
                        }}
                        className="px-2 py-1 border border-gray-300 rounded-md bg-white"
                        disabled={isBusy}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md"
                        disabled={isBusy}
                    >
                        Export
                    </button>
                </div>
            </div>

            <div className="my-5">
                <table className="table-auto bg-gray-100 w-full">
                    <thead className="sticky top-0">
                        <tr className="bg-slate-300">
                            <th className="px-4 py-2">ID / Event ID</th>
                            <th className="px-4 py-2">Site</th>
                            <th className="px-4 py-2">Date/Time</th>
                            <th className="px-4 py-2">Home Team</th>
                            <th className="px-4 py-2">Guest Team</th>
                            <th className="px-4 py-2">Location</th>
                            <th className="px-4 py-2">Division</th>
                            <th className="px-4 py-2">Surface ID</th>
                            <th className="px-4 py-2">Surface</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>

            {pagination && totalPages > 1 && (
                <div className="flex justify-between items-center my-4">
                    <div className="flex gap-2">
                        <button
                            onClick={handleFirstPage}
                            disabled={currentPage === 1 || isBusy}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            First
                        </button>
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1 || isBusy}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                    </div>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages || isBusy}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                        <button
                            onClick={handleLastPage}
                            disabled={currentPage >= totalPages || isBusy}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Last
                        </button>
                    </div>
                </div>
            )}

            {events.length === 0 && !isBusy &&
                <p className="text-gray-600 text-center mt-4">No events found</p>
            }
        </div>
    )
}
