import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { Field, Label, Select, Button, Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useAuth } from './AuthProvider.jsx'
import SurfaceDialog from './surface-dialog.jsx'

const apiurl = import.meta.env.VITE_API_URL

export default function Home() {
    const [siteLoc, setSiteLoc] = useState([])
    const [site, setSite] = useState("")
    const [allSites, setAllSites] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [currSiteLoc, setCurrSiteLoc] = useState(null)
    const [isBusy, setBusy] = useState(false)
    const [selectorFor, setSelectorFor] = useState(null)
    const [locations, setLocations] = useState([])
    const [showLocationsModal, setShowLocationsModal] = useState(false)
    const [locationModalSiteLoc, setLocationModalSiteLoc] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(25)
    const [pagination, setPagination] = useState(null)
    const [nameFilter, setNameFilter] = useState('')
    const [debouncedNameFilter, setDebouncedNameFilter] = useState(nameFilter)
    const [locationFilter, setLocationFilter] = useState('')
    const [debouncedLocationFilter, setDebouncedLocationFilter] = useState('')
    const [siteLocCurrentPage, setSiteLocCurrentPage] = useState(1)
    const [siteLocPageSize, setSiteLocPageSize] = useState(25)
    const [siteLocPagination, setSiteLocPagination] = useState(null)
    const auth = useAuth()
    const api = auth.api
    const dropdownRef = useRef(null)

    const fetchSiteLocations = useCallback(() => {
        setBusy(true)
        const params = { page: siteLocCurrentPage, perPage: siteLocPageSize }
        if (site) params.site = site
        if (debouncedLocationFilter) params.location = debouncedLocationFilter
        api.get(apiurl + "/site-locations", { params }).then((resp) => {
            const data = resp.data && resp.data.data ? resp.data.data : resp.data
            setSiteLoc(data || [])
            if (resp.data && resp.data.total !== undefined && resp.data.perPage !== undefined) {
                setSiteLocPagination(resp.data)
            } else {
                setSiteLocPagination(null)
            }
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    }, [site, api, siteLocCurrentPage, siteLocPageSize, debouncedLocationFilter])

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedNameFilter(nameFilter), 500)
        return () => clearTimeout(handler)
    }, [nameFilter])

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedLocationFilter(locationFilter), 500)
        return () => clearTimeout(handler)
    }, [locationFilter])

    useEffect(() => {
        // reset to first page whenever filter changes
        setCurrentPage(1)
    }, [debouncedNameFilter])

    useEffect(() => {
        // reset to first page whenever site changes
        setSiteLocCurrentPage(1)
        setLocationFilter('')
    }, [site])

    useEffect(() => {
        // reset to first page whenever location filter changes
        setSiteLocCurrentPage(1)
    }, [debouncedLocationFilter])

    useEffect(() => {
        fetchSiteLocations()
    }, [fetchSiteLocations])

    useEffect(function() {
        setBusy(true)
        api.get(apiurl + "/sites").then((resp) => {
            setAllSites(resp.data)
        }).finally(() => setBusy(false))
    }, [api])


    useEffect(function() {
        if (!api || !showLocationsModal) return
        setBusy(true)
        const params = { page: currentPage, perPage: pageSize }
        if (debouncedNameFilter) params.name = debouncedNameFilter
        api.get(apiurl + "/locations", { params }).then((resp) => {
            const data = resp.data && resp.data.data ? resp.data.data : resp.data
            setLocations(data || [])
            setPagination(resp.data)
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    }, [api, showLocationsModal, currentPage, pageSize, debouncedNameFilter])

    useEffect(function() {
        function handleOutside(e) {
            if (!dropdownRef.current) return
            if (!dropdownRef.current.contains(e.target)) {
                setSelectorFor(null)
            }
        }
        function handleKey(e) {
            if (e.key === 'Escape') {
                // close all popups/dialogs
                setSelectorFor(null)
                setIsOpen(false)
                setShowLocationsModal(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        document.addEventListener('keydown', handleKey)
        return () => {
            document.removeEventListener('mousedown', handleOutside)
            document.removeEventListener('keydown', handleKey)
        }
    }, [dropdownRef, setIsOpen, setShowLocationsModal])

    let assignSurface = function(rec) {
        setCurrSiteLoc(rec)
        setIsOpen(true)
    }

    let surfaceSelected = function(id, siteloc) {
        setIsOpen(false)
        setBusy(true)
        api.post(apiurl + "/set-surface", {
            site: siteloc.site,
            location: siteloc.location,
            surface_id: id,
        }).then(() => fetchSiteLocations()).catch((e) => console.error(e)).finally(() => {
            setBusy(false)
        })
    }

    let locationSelected = function(id, siteloc) {
        setShowLocationsModal(false)
        setBusy(true)
        api.post(apiurl + "/set-location", {
            site: siteloc.site,
            location: siteloc.location,
            location_id: id,
        }).then(() => fetchSiteLocations()).catch((e) => console.error(e)).finally(() => {
            setBusy(false)
        })
    }

    const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1))
    const handleNextPage = () => setCurrentPage(p => p + 1)
    const handleFirstPage = () => setCurrentPage(1)
    const handleLastPage = () => {
        const total = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1
        setCurrentPage(total)
    }
    const totalPages = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1

    const handleSiteLocPrevPage = () => setSiteLocCurrentPage(p => Math.max(1, p - 1))
    const handleSiteLocNextPage = () => setSiteLocCurrentPage(p => p + 1)
    const handleSiteLocFirstPage = () => setSiteLocCurrentPage(1)
    const handleSiteLocLastPage = () => {
        const total = siteLocPagination ? Math.ceil(siteLocPagination.total / siteLocPagination.perPage) : 1
        setSiteLocCurrentPage(total)
    }
    const siteLocTotalPages = siteLocPagination ? Math.ceil(siteLocPagination.total / siteLocPagination.perPage) : 1

    const handleClearLocationFilter = () => {
        setLocationFilter('')
        setSiteLocCurrentPage(1)
    }

    let unsetMapping = function(type, siteloc) {
        setBusy(true)
        api.post(apiurl + "/unset-mapping", {
            site: siteloc.site,
            location: siteloc.location,
            type: type,
        }).then(() => fetchSiteLocations()).catch((e) => console.error(e)).finally(() => {
            setBusy(false)
        })
    }

    let rows = []

    if (siteLoc.length > 0) {
        rows = siteLoc.map(r => (
            <tr key={`${r.site}-${r.location}`} className="even:bg-gray-50 odd:bg-gray-200">
                <td className="text-left w-40">{r.site}</td>
                <td className="text-left">{r.location}</td>
                <td className="text-left">{r.address}</td>
                <td className="text-left">
                    <div className="flex justify-between items-center">
                        <span>{r.location_id}</span>
                    </div>
                </td>
                <td className="text-left">{r.LiveBarnLocation.name}</td>
                <td className="text-left">
                    <div className="flex justify-between items-center">
                        <span>{r.surface_id}</span>
                    </div>
                </td>
                <td className="text-left">{r.LinkedSurface.name}</td>
                <td className="text-left w-48">
                    <div className="relative inline-block overflow-visible" ref={selectorFor === `${r.site}-${r.location}` ? dropdownRef : null}>
                        <Button className="rounded bg-sky-600 py-2 px-2 text-xs text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700" onClick={() => setSelectorFor(selectorFor === `${r.site}-${r.location}` ? null : `${r.site}-${r.location}`)}>Change</Button>
                        {selectorFor === `${r.site}-${r.location}` && <div className="absolute right-0 mt-1 w-36 bg-white border rounded shadow-md flex flex-col" style={{ zIndex: 9999 }}>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={() => { setSelectorFor(null); assignSurface(r); }}>Surface</button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={() => { setSelectorFor(null); setLocationModalSiteLoc(r); setShowLocationsModal(true); }}>Location</button>
                        </div>}
                    </div>
                    <div className="mt-2 flex gap-2">
                        {r.surface_id != 0 &&
                            <Button className="rounded bg-emerald-600 py-2 px-2 text-xs text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700" onClick={() => unsetMapping('surface', r)}>Reset Surface</Button>
                        }
                        {r.location_id != 0 &&
                            <Button className="rounded bg-amber-600 py-2 px-2 text-xs text-white data-[hover]:bg-amber-500 data-[active]:bg-amber-700" onClick={() => unsetMapping('location', r)}>Reset Location</Button>
                        }
                    </div>
                </td>
            </tr>
        ))
    }

    let options = []
    if (allSites.length > 0) {
        options = allSites.map((r) => (
            <option key={r.site_name} value={r.site_name}>{r.display_name || r.site_name}</option>
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

            <SurfaceDialog province="Ontario" api={api} isOpen={isOpen} siteLoc={currSiteLoc} setIsOpen={setIsOpen} surfaceSelected={surfaceSelected} />

            <Dialog open={showLocationsModal} onClose={() => setShowLocationsModal(false)} className="relative z-50">
                <div className="fixed inset-0 flex w-screen justify-center bg-white p-4">
                    <div className="flex items-center justify-center ">
                        <DialogPanel className=" w-max  h-full overflow-auto  space-y-2 border bg-white p-2">
                            <DialogTitle className="font-bold">Select location for <span className="text-orange-500">{locationModalSiteLoc && locationModalSiteLoc.location}</span></DialogTitle>
                            <Description />

                            <div className="flex items-center justify-between mb-2">
                                <input type="text" value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder="Filter by name..." className="px-2 py-1 border rounded-md w-64" />
                                <div className="text-sm text-gray-600">Showing {pagination && pagination.total ? pagination.total : locations.length} results</div>
                            </div>

                            <table className="table-auto w-full border">
                                <thead className="sticky top-0">
                                    <tr className="bg-gray-100">
                                        <th>ID</th><th>Name</th><th>City</th><th>Postal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {locations && locations.map(l => (
                                        <tr key={l.id} className="even:bg-gray-50 odd:bg-gray-200">
                                            <td className="border"><a href="#" className="font-bold text-blue-600 hover:text-blue-400" onClick={() => locationSelected(l.id, locationModalSiteLoc)}>{l.id}</a></td>
                                            <td className="border">{l.name}</td>
                                            <td className="border">{l.city}</td>
                                            <td className="border">{l.postal_code}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {pagination && totalPages > 1 && (
                                <div className="flex justify-between items-center my-2">
                                    <div className="flex gap-2">
                                        <button onClick={handleFirstPage} disabled={currentPage === 1 || isBusy} className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">First</button>
                                        <button onClick={handlePrevPage} disabled={currentPage === 1 || isBusy} className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">Previous</button>
                                    </div>
                                    <div>Page {currentPage} of {totalPages}</div>
                                    <div className="flex gap-2">
                                        <button onClick={handleNextPage} disabled={currentPage >= totalPages || isBusy} className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">Next</button>
                                        <button onClick={handleLastPage} disabled={currentPage >= totalPages || isBusy} className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">Last</button>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button className="rounded bg-sky-600 py-2 px-4 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700" onClick={() => setShowLocationsModal(false)}>Cancel</Button>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>

            <h1 className="text-xl font-bold text-left mb-4">Match Surfaces</h1>
            <Field >
                <div className="flex justify-start items-center">
                    <Label className="text-sm/6 font-medium">Site</Label>&nbsp;&nbsp;
                    <Select onChange={(e) => setSite(e.currentTarget.value)} className="rounded border-solid outline outline-gray-400 outline-2 w-64" >
                        <option value="">All</option>
                        {options}
                    </Select>
                    {site ? <span className="ml-4 text-sm font-medium">Selected: {site}</span> : <span className="ml-4 text-sm font-medium">All sites</span>}
                </div>
            </Field >
            <Field className="my-5">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-4 items-center">
                        <input
                            type="text"
                            value={locationFilter}
                            onChange={e => setLocationFilter(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md"
                            placeholder="Filter by location..."
                            disabled={isBusy}
                        />
                        <button
                            onClick={handleClearLocationFilter}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                            disabled={isBusy || locationFilter === ''}
                        >
                            Clear Filter
                        </button>
                    </div>
                    <div className="text-sm text-gray-600">
                        Showing {siteLocPagination && siteLocPagination.total ? siteLocPagination.total : siteLoc.length} results
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Per page:</span>
                        <select
                            value={siteLocPageSize}
                            onChange={(e) => {
                                setSiteLocPageSize(Number(e.target.value))
                                setSiteLocCurrentPage(1)
                            }}
                            disabled={isBusy}
                            className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>
                <table className="bg-gray-100 w-full">
                    <thead className="sticky top-0">
                        <tr className="bg-slate-300">
                            <th>Site</th><th>Location</th><th>Address</th>
                            <th>Livebarn Location ID</th>
                            <th>Livebarn Location Name</th>
                            <th>Surface ID</th>
                            <th>Surface Name</th>
                            <th className="w-48">Actions</th>
                        </tr>

                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
                {siteLocPagination && siteLocTotalPages > 1 && (
                    <div className="flex justify-between items-center my-4">
                        <div className="flex gap-2">
                            <button
                                onClick={handleSiteLocFirstPage}
                                disabled={siteLocCurrentPage === 1 || isBusy}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                            >
                                First
                            </button>
                            <button
                                onClick={handleSiteLocPrevPage}
                                disabled={siteLocCurrentPage === 1 || isBusy}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                            >
                                Previous
                            </button>
                        </div>
                        <span>
                            Page {siteLocCurrentPage} of {siteLocTotalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSiteLocNextPage}
                                disabled={siteLocCurrentPage >= siteLocTotalPages || isBusy}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                            >
                                Next
                            </button>
                            <button
                                onClick={handleSiteLocLastPage}
                                disabled={siteLocCurrentPage >= siteLocTotalPages || isBusy}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </Field >
        </div>
    )
}
