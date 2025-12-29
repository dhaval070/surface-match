import { useState, useEffect, useRef } from 'react'
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
    const [pageSize, setPageSize] = useState(25)
    const [pagination, setPagination] = useState(null)
    const [nameFilter, setNameFilter] = useState('')
    const [debouncedNameFilter, setDebouncedNameFilter] = useState(nameFilter)
    const auth = useAuth()
    const api = auth.api
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedNameFilter(nameFilter), 500)
        return () => clearTimeout(handler)
    }, [nameFilter])

    useEffect(() => {
        // reset to first page whenever filter changes
        setCurrentPage(1)
    }, [debouncedNameFilter])

    useEffect(function() {
        if (site == "") {
            setSiteLoc([])
            return
        }
        setBusy(true)
        api.get(apiurl + "/site-locations/" + site.toString()).then((resp) => {
            setSiteLoc(resp.data)
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    }, [site, api]);

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
            site: site,
            location: siteloc.location,
            surface_id: id,
        }).then(resp => setSiteLoc(resp.data)).catch((e) => console.error(e)).finally(() => {
            setBusy(false)
        })
    }

    let locationSelected = function(id, siteloc) {
        setShowLocationsModal(false)
        setBusy(true)
        api.post(apiurl + "/set-location", {
            site: site,
            location: siteloc.location,
            location_id: id,
        }).then(resp => setSiteLoc(resp.data)).catch((e) => console.error(e)).finally(() => {
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

    let unsetMapping = function(type, siteloc) {
        setBusy(true)
        api.post(apiurl + "/unset-mapping", {
            site: site,
            location: siteloc.location,
            type: type,
        }).then(resp => setSiteLoc(resp.data)).catch((e) => console.error(e)).finally(() => {
            setBusy(false)
        })
    }

    let rows = []

    if (siteLoc.length > 0) {
        rows = siteLoc.map(r => (
            <tr key={r.location} className="even:bg-gray-50 odd:bg-gray-200">
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
                <td className="text-left whitespace-nowrap w-48">
                    <div className="relative inline-block overflow-visible" ref={selectorFor === r.location ? dropdownRef : null}>
                        <Button className="rounded bg-sky-600 py-2 px-2 text-xs text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700" onClick={() => setSelectorFor(selectorFor === r.location ? null : r.location)}>Change</Button>
                        {selectorFor === r.location && <div className="absolute right-0 mt-1 w-36 bg-white border rounded shadow-md flex flex-col" style={{ zIndex: 9999 }}>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={() => { setSelectorFor(null); assignSurface(r); }}>Surface</button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={() => { setSelectorFor(null); setLocationModalSiteLoc(r); setShowLocationsModal(true); }}>Location</button>
                        </div>}
                    </div>
                    &nbsp;&nbsp;
                    {r.surface_id != 0 &&
                        <Button className="rounded bg-emerald-600 py-2 px-2 text-xs text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700" onClick={() => unsetMapping('surface', r)}>Reset Surface</Button>
                    }
                    &nbsp;&nbsp;
                    {r.location_id != 0 &&
                        <Button className="rounded bg-amber-600 py-2 px-2 text-xs text-white data-[hover]:bg-amber-500 data-[active]:bg-amber-700" onClick={() => unsetMapping('location', r)}>Reset Location</Button>
                    }
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
                                    <tr key={l.id}>
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
                        <option value="">Select</option>
                        {options}
                    </Select>
                    {site && <span className="ml-4 text-sm font-medium">Selected: {site}</span>}
                </div>
            </Field >
            <Field className="my-5">
                <table className="bg-gray-100 w-full">
                    <thead className="sticky top-0">
                        <tr className="bg-slate-300">
                            <th>Location</th><th>Address</th>
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
            </Field >
        </div>
    )
}
