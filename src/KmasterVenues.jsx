import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './AuthProvider.jsx'
import KmasterVenueDialog from './KmasterVenueDialog.jsx'
import { Field, Label, Select } from '@headlessui/react'

const apiurl = import.meta.env.VITE_API_URL

const US_STATES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
    'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const CA_PROVINCES = [
    'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT',
]

export default function KmasterVenues() {
    const [venues, setVenues] = useState([])
    const [isBusy, setBusy] = useState(false)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)

    const [showDialog, setShowDialog] = useState(false)
    const [editingVenue, setEditingVenue] = useState(null)

    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [apiMessage, setApiMessage] = useState(null)

    const [filterCountry, setFilterCountry] = useState('')
    const [filterState, setFilterState] = useState('')
    const [filterLivebarn, setFilterLivebarn] = useState('')

    const auth = useAuth()
    const api = auth.api

    const fetchVenues = (p, ps) => {
        setBusy(true)
        const params = new URLSearchParams({ page: p, perPage: ps })
        if (filterCountry) params.append('country', filterCountry)
        if (filterState) params.append('state', filterState)
        if (filterLivebarn !== '') params.append('livebarn', filterLivebarn)
        api.get(`${apiurl}/kmaster-venues?${params.toString()}`).then((resp) => {
            setVenues(resp.data.data || [])
            setTotal(resp.data.total || 0)
            setPageSize(resp.data.perPage || 10)
        }).catch(e => {
            console.error("API Error:", e)
        }).finally(() => setBusy(false))
    }

    useEffect(() => {
        fetchVenues(page, pageSize)
    }, [api, page, pageSize, filterCountry, filterState, filterLivebarn])

    const totalPages = Math.ceil(total / pageSize)

    const handlePrevPage = () => setPage(p => Math.max(1, p - 1))
    const handleNextPage = () => setPage(p => p + 1)
    const handleFirstPage = () => setPage(1)
    const handleLastPage = () => setPage(totalPages)

    const openCreate = () => {
        setEditingVenue(null)
        setShowDialog(true)
    }

    const openEdit = (venue) => {
        setEditingVenue(venue)
        setShowDialog(true)
    }

    const handleDialogSave = () => {
        setShowDialog(false)
        setEditingVenue(null)
        fetchVenues(page, pageSize)
    }

    const handleDelete = (venue) => {
        setDeleteConfirm(venue)
    }

    const confirmDelete = () => {
        if (!deleteConfirm) return
        setBusy(true)
        api.delete(`${apiurl}/kmaster-venues/${deleteConfirm.id}`).then(() => {
            setDeleteConfirm(null)
            setApiMessage(`Venue "${deleteConfirm.venue_name}" deleted`)
            setTimeout(() => setApiMessage(null), 3000)
            fetchVenues(page, pageSize)
        }).catch(e => {
            console.error("Delete error:", e)
            setApiMessage("Failed to delete venue")
            setTimeout(() => setApiMessage(null), 3000)
        }).finally(() => setBusy(false))
    }

    const formatDate = (dateString) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString()
    }

    let rows = []
    if (venues.length > 0) {
        rows = venues.map(r => (
            <tr key={r.id} className="even:bg-gray-50 odd:bg-gray-200">
                <td className="text-left px-4 py-2">{r.id}</td>
                <td className="text-left px-4 py-2 font-medium">{r.venue_name}</td>
                <td className="text-left px-4 py-2">{r.venue_type}</td>
                <td className="text-left px-4 py-2">{r.city}</td>
                <td className="text-left px-4 py-2">{r.province_state}</td>
                <td className="text-left px-4 py-2">{r.country}</td>
                <td className="text-left px-4 py-2">{r.surfaces}</td>
                <td className="text-left px-4 py-2">{r.account_status}</td>
                <td className={`text-left px-4 py-2 ${r.livebarn_venue_id_matched === false && r.livebarn_venue_id ? 'text-red-600' : ''}`}>{r.livebarn_venue_id ?? ''}</td>
                <td className={`text-left px-4 py-2 ${r.mhr_venue_id_matched === false && r.mhr_venue_id ? 'text-red-600' : ''}`}>{r.mhr_venue_id ?? ''}</td>
                <td className="text-left px-4 py-2">{formatDate(r.created_at)}</td>
                <td className="text-left px-4 py-2 whitespace-nowrap">
                    <button
                        onClick={() => openEdit(r)}
                        className="px-3 py-1 bg-sky-600 text-white text-xs rounded-md hover:bg-sky-500 mr-2"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleDelete(r)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-500"
                    >
                        Delete
                    </button>
                </td>
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

            <KmasterVenueDialog
                isOpen={showDialog}
                setIsOpen={setShowDialog}
                api={api}
                venue={editingVenue}
                onSave={handleDialogSave}
            />

            {deleteConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
                        <h3 className="text-lg font-bold mb-4">Delete Venue</h3>
                        <p className="mb-6">
                            Are you sure you want to delete <strong>{deleteConfirm.venue_name}</strong> (ID: {deleteConfirm.id})?
                        </p>
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h1 className="text-xl font-bold text-left mb-4">KMaster Venues</h1>

            <div className="mb-4 flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                    <Field className="flex items-center space-x-2">
                        <Label className="text-sm font-medium whitespace-nowrap">Country</Label>
                        <Select
                            value={filterCountry}
                            onChange={e => { setFilterCountry(e.target.value); setFilterState('') }}
                            className="rounded border border-gray-300 px-3 py-2 text-sm"
                        >
                            <option value="">All</option>
                            <option value="USA">USA</option>
                            <option value="CA">CA</option>
                        </Select>
                    </Field>

                    <Field className="flex items-center space-x-2">
                        <Label className="text-sm font-medium whitespace-nowrap">State/Province</Label>
                        <Select
                            value={filterState}
                            onChange={e => setFilterState(e.target.value)}
                            className="rounded border border-gray-300 px-3 py-2 text-sm"
                        >
                            <option value="">All</option>
                            {filterCountry === 'USA' && US_STATES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                            {filterCountry === 'CA' && CA_PROVINCES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </Select>
                    </Field>

                    <Field className="flex items-center space-x-2">
                        <Label className="text-sm font-medium whitespace-nowrap">LiveBarn</Label>
                        <Select
                            value={filterLivebarn}
                            onChange={e => setFilterLivebarn(e.target.value)}
                            className="rounded border border-gray-300 px-3 py-2 text-sm"
                        >
                            <option value="">All</option>
                            <option value="true">Matched</option>
                            <option value="false">Not Matched</option>
                        </Select>
                    </Field>
                </div>
                <div className="flex items-center gap-4">
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
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500"
                    >
                        + Add Venue
                    </button>
                </div>
            </div>

            <div className="my-5">
                <table className="table-auto bg-gray-100 w-full">
                    <thead className="sticky top-0">
                        <tr className="bg-slate-300">
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">Venue Name</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">City</th>
                            <th className="px-4 py-2">Province/State</th>
                            <th className="px-4 py-2">Country</th>
                            <th className="px-4 py-2">Surfaces</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">LiveBarn Venue ID</th>
                            <th className="px-4 py-2">MHR Venue ID</th>
                            <th className="px-4 py-2">Created</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>

            {venues.length === 0 && !isBusy &&
                <p className="text-gray-600 text-center mt-4">No venues found</p>
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
