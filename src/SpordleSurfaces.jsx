import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './AuthProvider.jsx'

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

const apiurl = import.meta.env.VITE_API_URL

export default function SpordleSurfaces() {
    const [surfaces, setSurfaces] = useState([])
    const [isBusy, setBusy] = useState(false)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    const [apiMessage, setApiMessage] = useState(null)

    const [filterName, setFilterName] = useState('')
    const debouncedFilterName = useDebounce(filterName, 500)

    useEffect(() => {
        setPage(1)
    }, [debouncedFilterName])

    const auth = useAuth()
    const api = auth.api

    const fetchSurfaces = (p, ps) => {
        setBusy(true)
        const params = new URLSearchParams({ page: p, perPage: ps })
        if (debouncedFilterName) params.append('name', debouncedFilterName)
        api.get(`${apiurl}/spordle-surfaces?${params.toString()}`).then((resp) => {
            setSurfaces(resp.data.data || [])
            setTotal(resp.data.total || 0)
            setPageSize(resp.data.perPage || 10)
        }).catch(e => {
            console.error("API Error:", e)
        }).finally(() => setBusy(false))
    }

    useEffect(() => {
        fetchSurfaces(page, pageSize)
    }, [api, page, pageSize, debouncedFilterName])

    const totalPages = Math.ceil(total / pageSize)

    const handlePrevPage = () => setPage(p => Math.max(1, p - 1))
    const handleNextPage = () => setPage(p => p + 1)
    const handleFirstPage = () => setPage(1)
    const handleLastPage = () => setPage(totalPages)

    const formatDate = (dateString) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString()
    }

    let rows = []
    if (surfaces.length > 0) {
        rows = surfaces.map(r => (
            <tr key={r.id} className="even:bg-gray-50 odd:bg-gray-200">
                <td className="text-left px-4 py-2">{r.id}</td>
                <td className="text-left px-4 py-2 font-medium">{r.venue_name}</td>
                <td className="text-left px-4 py-2">{r.venue_address}</td>
                <td className="text-left px-4 py-2">{r.venue_city}</td>
                <td className="text-left px-4 py-2">{r.venue_region}</td>
                <td className="text-left px-4 py-2">{r.venue_country}</td>
                <td className="text-left px-4 py-2">{r.surface_name}</td>
                <td className="text-left px-4 py-2">{r.surface_type}</td>
                <td className="text-left px-4 py-2">{r.surface_size}</td>
                <td className="text-left px-4 py-2">{r.surface_sports}</td>
                <td className="text-left px-4 py-2">{r.livebarn_surface_id || ''}</td>
                <td className="text-left px-4 py-2">{r.number_of_games_coming ?? ''}</td>
                <td className="text-left px-4 py-2">{formatDate(r.created_at)}</td>
            </tr>
        ))
    }

    return (
        <div className="App w-full">
            {isBusy &&
                <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
                    <div className="flex justify-center items-center mt-[50vh]">
                        <div className="fas fa-circle-notch fa-spin fa-5x text-violet-600"></div>
                    </div>
                </div>
            }

            {apiMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    {apiMessage}
                </div>
            )}

            <h1 className="text-xl font-bold text-left mb-4">Spordle Surfaces</h1>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap items-center gap-4">
                    <input
                        type="text"
                        value={filterName}
                        onChange={e => setFilterName(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                        placeholder="Filter by venue name..."
                    />

                    <button
                        onClick={() => {
                            setFilterName('')
                            setPage(1)
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50 text-sm"
                        disabled={isBusy || filterName === ''}
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="flex justify-end items-center mb-3">
                <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm font-medium">Per Page:</label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={e => {
                            setPageSize(Number(e.target.value))
                            setPage(1)
                        }}
                        className="px-2 py-1 border border-gray-300 rounded-md bg-white"
                        disabled={isBusy}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            <div className="my-5 overflow-x-auto">
                <table className="table-auto bg-gray-100 w-full">
                    <thead className="sticky top-0">
                        <tr className="bg-slate-300">
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">Venue Name</th>
                            <th className="px-4 py-2">Address</th>
                            <th className="px-4 py-2">City</th>
                            <th className="px-4 py-2">Region</th>
                            <th className="px-4 py-2">Country</th>
                            <th className="px-4 py-2">Surface Name</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Size</th>
                            <th className="px-4 py-2">Sports</th>
                            <th className="px-4 py-2">LiveBarn ID</th>
                            <th className="px-4 py-2">Games</th>
                            <th className="px-4 py-2">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>

            {surfaces.length === 0 && !isBusy &&
                <p className="text-gray-600 text-center mt-4">No surfaces found</p>
            }

            {totalPages > 1 && (
                <div className="flex justify-between items-center my-4">
                    <div className="flex gap-2">
                        <button
                            onClick={handleFirstPage}
                            disabled={page === 1 || isBusy}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            First
                        </button>
                        <button
                            onClick={handlePrevPage}
                            disabled={page === 1 || isBusy}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                    </div>
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleNextPage}
                            disabled={page >= totalPages || isBusy}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                        <button
                            onClick={handleLastPage}
                            disabled={page >= totalPages || isBusy}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            Last
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
