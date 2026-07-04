import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { Field, Label, Select, Button, Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'
import SurfaceDialog from './surface-dialog.jsx'

const apiurl = import.meta.env.VITE_API_URL

export default function Home() {
    const auth = useAuth()
    const api = auth.api
    const [searchParams] = useSearchParams()
    const initialSite = searchParams.get('site') || ''
    const [siteLoc, setSiteLoc] = useState([])
    const [site, setSite] = useState(initialSite)
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
    const [tagFilter, setTagFilter] = useState('')
    const [selectedTag, setSelectedTag] = useState(null)
    const [tagSuggestions, setTagSuggestions] = useState([])
    const [showTagSuggestions, setShowTagSuggestions] = useState(false)
    const [siteLocCurrentPage, setSiteLocCurrentPage] = useState(1)
    const [siteLocPageSize, setSiteLocPageSize] = useState(25)
    const [siteLocPagination, setSiteLocPagination] = useState(null)
    const [eventsMatched, setEventsMatched] = useState(0)
    const [gamesClaimed, setGamesClaimed] = useState(0)
    const [siteScrapingStatus, setSiteScrapingStatus] = useState(null)
    const [scrapeStatusLoading, setScrapeStatusLoading] = useState(false)
    const [scrapeTriggerLoading, setScrapeTriggerLoading] = useState(false)
    const [confirmScrapeOpen, setConfirmScrapeOpen] = useState(false)
    const [errorModalOpen, setErrorModalOpen] = useState(false)
    const [errorDetails, setErrorDetails] = useState('')
    const [readinessUpdateMsg, setReadinessUpdateMsg] = useState('')
    const [showTagsModal, setShowTagsModal] = useState(false)
    const [tagsModalSiteLoc, setTagsModalSiteLoc] = useState(null)
    const [allTags, setAllTags] = useState([])
    const [selectedTagIds, setSelectedTagIds] = useState(new Set())
    const [originalTagIds, setOriginalTagIds] = useState(new Set())
    const [tagSearch, setTagSearch] = useState('')
    const [tagBusy, setTagBusy] = useState(false)
    const [newTagName, setNewTagName] = useState('')
    const [confirmDeleteTagId, setConfirmDeleteTagId] = useState(null)
    const [confirmDeleteTagName, setConfirmDeleteTagName] = useState('')
    const dropdownRef = useRef(null)
    const scrapeStatusIntervalRef = useRef(null)
    const prevScrapeStatusRef = useRef(null)

    const fetchSiteLocations = useCallback(() => {
        setBusy(true)
        const params = { page: siteLocCurrentPage, perPage: siteLocPageSize }
        if (site) params.site = site
        if (debouncedLocationFilter) params.location = debouncedLocationFilter
        if (selectedTag) params.tag = selectedTag.name
        api.get(apiurl + "/site-locations", { params }).then((resp) => {
            const data = resp.data && resp.data.data ? resp.data.data : resp.data
            setSiteLoc(data || [])
            if (resp.data && resp.data.total !== undefined && resp.data.perPage !== undefined) {
                setSiteLocPagination(resp.data)
            } else {
                setSiteLocPagination(null)
            }
            setEventsMatched(resp.data?.events_matched ?? 0)
            setGamesClaimed(resp.data?.games_claimed ?? 0)
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    }, [site, api, siteLocCurrentPage, siteLocPageSize, debouncedLocationFilter, selectedTag])

    const fetchScrapeStatus = useCallback((siteName) => {
        if (!siteName) {
            setSiteScrapingStatus(null)
            return
        }
        setScrapeStatusLoading(true)
        api.get(apiurl + `/scrape/status/${siteName}`)
            .then((resp) => {
                const newStatus = resp.data
                const prevStatus = prevScrapeStatusRef.current
                const wasRunning = prevStatus && prevStatus.status === 'running'
                const isNotRunning = newStatus && newStatus.status !== 'running'
                setSiteScrapingStatus(newStatus)
                prevScrapeStatusRef.current = newStatus
                if (wasRunning && isNotRunning) {
                    fetchSiteLocations()
                }
            })
            .catch((e) => {
                console.error('Failed to fetch scrape status:', e)
                setSiteScrapingStatus(null)
                prevScrapeStatusRef.current = null
            })
            .finally(() => setScrapeStatusLoading(false))
    }, [api, fetchSiteLocations])

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedNameFilter(nameFilter), 500)
        return () => clearTimeout(handler)
    }, [nameFilter])

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedLocationFilter(locationFilter), 500)
        return () => clearTimeout(handler)
    }, [locationFilter])

    useEffect(() => {
        const handler = setTimeout(() => {
            if (tagFilter && !selectedTag) {
                api.get(apiurl + "/tags", { params: { q: tagFilter } }).then(resp => {
                    setTagSuggestions(resp.data || [])
                    setShowTagSuggestions(true)
                }).catch(() => setTagSuggestions([]))
            } else if (!tagFilter) {
                setTagSuggestions([])
                setShowTagSuggestions(false)
            }
        }, 300)
        return () => clearTimeout(handler)
    }, [tagFilter, selectedTag, api])

    useEffect(() => {
        // reset to first page whenever filter changes
        setCurrentPage(1)
    }, [debouncedNameFilter])

    useEffect(() => {
        // reset to first page whenever site changes
        setSiteLocCurrentPage(1)
        setLocationFilter('')
        setTagFilter('')
        setSelectedTag(null)
    }, [site])

    useEffect(() => {
        // clear any existing interval
        if (scrapeStatusIntervalRef.current) {
            clearInterval(scrapeStatusIntervalRef.current)
            scrapeStatusIntervalRef.current = null
        }
        // reset previous status ref when site changes
        prevScrapeStatusRef.current = null
        // clear status when no site selected
        if (!site) {
            setSiteScrapingStatus(null)
            return
        }
        // fetch immediately
        fetchScrapeStatus(site)
        // set up polling every 5 seconds
        scrapeStatusIntervalRef.current = setInterval(() => {
            fetchScrapeStatus(site)
        }, 5000)
        // cleanup
        return () => {
            if (scrapeStatusIntervalRef.current) {
                clearInterval(scrapeStatusIntervalRef.current)
                scrapeStatusIntervalRef.current = null
            }
        }
    }, [site, fetchScrapeStatus])

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
                setShowTagsModal(false)
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

    const openErrorModal = (error) => {
        setErrorDetails(error || 'No error details available')
        setErrorModalOpen(true)
    }

    const openConfirmScrape = () => {
        if (!site) return
        setConfirmScrapeOpen(true)
    }

    const performScrape = useCallback(() => {
        setConfirmScrapeOpen(false)
        if (!site) return
        setScrapeTriggerLoading(true)
        api.post(apiurl + "/scrape", { site: site })
            .then(() => {
                // Optimistically update status to running
                setSiteScrapingStatus(prev => ({
                    ...(prev || {}),
                    site: site,
                    status: 'running',
                    started_at: new Date().toISOString(),
                    error: null
                }))
            })
            .catch((e) => {
                console.error('Failed to trigger scrape:', e)
                if (e.response?.status === 409) {
                    alert('Site is already being scraped')
                    setSiteScrapingStatus(prev => ({
                        ...(prev || {}),
                        site: site,
                        status: 'running',
                        error: null
                    }))
                } else {
                    alert('Failed to start scraping: ' + (e.response?.data?.error || e.message))
                }
            })
            .finally(() => setScrapeTriggerLoading(false))
    }, [site, api])

    const fetchAllTags = useCallback((q) => {
        api.get(apiurl + "/tags", { params: q ? { q } : {} }).then((resp) => {
            setAllTags(resp.data || [])
        }).catch(e => console.error('Failed to fetch tags:', e))
    }, [api])

    const fetchAssignedTags = useCallback((siteName, locationName) => {
        if (!siteName || !locationName) return
        api.get(apiurl + "/site-location-tags", { params: { site: siteName, location: locationName } }).then((resp) => {
            const ids = new Set((resp.data || []).map(t => t.id))
            setSelectedTagIds(ids)
            setOriginalTagIds(new Set(ids))
        }).catch(e => console.error('Failed to fetch assigned tags:', e))
    }, [api])

    const openTagsModal = useCallback((siteLoc) => {
        setTagsModalSiteLoc(siteLoc)
        setTagSearch('')
        setNewTagName('')
        setShowTagsModal(true)
    }, [])

    useEffect(() => {
        if (!showTagsModal || !tagsModalSiteLoc) return
        setTagBusy(true)
        Promise.all([
            fetchAllTags(),
            fetchAssignedTags(tagsModalSiteLoc.site, tagsModalSiteLoc.location)
        ]).finally(() => setTagBusy(false))
    }, [showTagsModal, tagsModalSiteLoc, fetchAllTags, fetchAssignedTags])

    useEffect(() => {
        if (!showTagsModal) return
        const handler = setTimeout(() => {
            fetchAllTags(tagSearch || undefined)
        }, 300)
        return () => clearTimeout(handler)
    }, [tagSearch, showTagsModal, fetchAllTags])

    const toggleTag = (tagId) => {
        setSelectedTagIds(prev => {
            const next = new Set(prev)
            if (next.has(tagId)) next.delete(tagId)
            else next.add(tagId)
            return next
        })
    }

    const handleCreateTag = () => {
        const name = newTagName.trim()
        if (!name) return
        setTagBusy(true)
        api.post(apiurl + "/tags", { name }).then((resp) => {
            const newTag = resp.data
            setAllTags(prev => [...prev, newTag])
            setSelectedTagIds(prev => new Set(prev).add(newTag.id))
            setNewTagName('')
        }).catch(e => console.error('Failed to create tag:', e)).finally(() => setTagBusy(false))
    }

    const handleSaveTags = () => {
        if (!tagsModalSiteLoc) return
        setTagBusy(true)
        const { site, location } = tagsModalSiteLoc
        const toAdd = [...selectedTagIds].filter(id => !originalTagIds.has(id))
        const toRemove = [...originalTagIds].filter(id => !selectedTagIds.has(id))
        const promises = []
        if (toAdd.length > 0) {
            promises.push(api.post(apiurl + "/site-location-tags", { tag_ids: toAdd }, { params: { site, location } }))
        }
        toRemove.forEach(id => {
            promises.push(api.delete(apiurl + "/site-location-tags", { params: { site, location, tag_id: id } }))
        })
        Promise.all(promises).then(() => {
            setShowTagsModal(false)
            fetchSiteLocations()
        }).catch(e => console.error('Failed to save tags:', e)).finally(() => setTagBusy(false))
    }

    const handleDeleteTag = () => {
        if (!confirmDeleteTagId) return
        setTagBusy(true)
        api.delete(apiurl + "/tags/" + confirmDeleteTagId).then(() => {
            setAllTags(prev => prev.filter(t => t.id !== confirmDeleteTagId))
            setSelectedTagIds(prev => {
                const next = new Set(prev)
                next.delete(confirmDeleteTagId)
                return next
            })
            setConfirmDeleteTagId(null)
            setConfirmDeleteTagName('')
            fetchSiteLocations()
        }).catch(e => console.error('Failed to delete tag:', e)).finally(() => setTagBusy(false))
    }

    const handleUpdateReadiness = (configId, newValue) => {
        api.put(apiurl + "/sites-config/" + configId + "/readiness", { readiness_status: newValue })
            .then(() => {
                setAllSites(prev => prev.map(s =>
                    s.id === configId ? { ...s, readiness_status: newValue } : s
                ))
                setReadinessUpdateMsg('Readiness status updated')
                setTimeout(() => setReadinessUpdateMsg(''), 3000)
            })
            .catch(e => {
                console.error('Failed to update readiness status:', e)
                alert('Failed to update readiness status: ' + (e.response?.data?.error || e.message))
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
        setDebouncedLocationFilter('')
        setTagFilter('')
        setSelectedTag(null)
        setSite('')
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

    const isScrapingRunning = siteScrapingStatus?.status === 'running'
    const siteConfig = allSites.find(s => s.site_name === site)
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
                <td className="text-left">{r.live_barn_location?.name}</td>
                <td className="text-left">
                    <div className="flex justify-between items-center">
                        <span>{r.surface_id}</span>
                    </div>
                </td>
                <td className="text-left">{r.linked_surface?.name}</td>
                <td className="text-left w-48">
                    <div className="relative inline-block overflow-visible" ref={selectorFor === `${r.site}-${r.location}` ? dropdownRef : null}>
                        <Button className="rounded bg-sky-600 py-2 px-2 text-xs text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setSelectorFor(selectorFor === `${r.site}-${r.location}` ? null : `${r.site}-${r.location}`)} disabled={isScrapingRunning}>Change</Button>
                        {selectorFor === `${r.site}-${r.location}` && <div className="absolute right-0 mt-1 w-36 bg-white border rounded shadow-md flex flex-col" style={{ zIndex: 9999 }}>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { setSelectorFor(null); assignSurface(r); }} disabled={isScrapingRunning}>Surface</button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { setSelectorFor(null); setLocationModalSiteLoc(r); setShowLocationsModal(true); }} disabled={isScrapingRunning}>Location</button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { setSelectorFor(null); openTagsModal(r); }} disabled={isScrapingRunning}>Tags</button>
                        </div>}
                    </div>
                    <div className="mt-2 flex gap-2">
                        {r.surface_id != 0 &&
                            <Button className="rounded bg-emerald-600 py-2 px-2 text-xs text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => unsetMapping('surface', r)} disabled={isScrapingRunning}>Reset Surface</Button>
                        }
                        {r.location_id != 0 &&
                            <Button className="rounded bg-amber-600 py-2 px-2 text-xs text-white data-[hover]:bg-amber-500 data-[active]:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => unsetMapping('location', r)} disabled={isScrapingRunning}>Reset Location</Button>
                        }
                    </div>
                </td>
            </tr>
        ))
    }

    let options = []
    if (allSites.length > 0) {
        options = allSites.map((r) => (
            <option key={r.site_name} value={r.site_name}>{r.display_name} ({r.site_name})</option>
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

            <Dialog open={errorModalOpen} onClose={() => setErrorModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4">
                    <DialogPanel className="max-w-4xl w-full max-h-[95vh] overflow-auto space-y-4 border bg-white p-6 rounded">
                        <DialogTitle className="font-bold text-xl">Scraping Error Details</DialogTitle>
                        <Description className="text-sm text-gray-600">
                            Error occurred during scraping for site <span className="font-semibold">{site}</span>.
                        </Description>
                        <div className="mt-4">
                            <div className="font-medium mb-2">Error:</div>
                            <pre className="bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre overflow-auto max-h-[70vh]">{errorDetails}</pre>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button className="rounded bg-gray-600 py-2 px-4 text-sm text-white data-[hover]:bg-gray-500 data-[active]:bg-gray-700" onClick={() => setErrorModalOpen(false)}>Close</Button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog open={confirmScrapeOpen} onClose={() => setConfirmScrapeOpen(false)} className="relative z-50">
                <div className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4">
                    <DialogPanel className="max-w-lg w-full max-h-[90vh] overflow-auto space-y-4 border bg-white p-6 rounded">
                        <DialogTitle className="font-bold text-xl">Confirm Scrape</DialogTitle>
                        <Description className="text-sm text-gray-600">
                            Are you sure you want to scrape site <span className="font-semibold">{site}</span>? This will start a new scraping job.
                        </Description>
                        <div className="flex gap-4 pt-4">
                            <Button className="rounded bg-gray-600 py-2 px-4 text-sm text-white data-[hover]:bg-gray-500 data-[active]:bg-gray-700" onClick={() => setConfirmScrapeOpen(false)}>Cancel</Button>
                            <Button className="rounded bg-emerald-600 py-2 px-4 text-sm text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700" onClick={performScrape}>Scrape</Button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog open={showTagsModal} onClose={() => setShowTagsModal(false)} className="relative z-50">
                <div className="fixed inset-0 flex w-screen justify-center bg-white p-4">
                    <div className="flex items-center justify-center">
                        <DialogPanel className="w-full max-w-lg max-h-[90vh] overflow-auto space-y-4 border bg-white p-6 rounded shadow-xl">
                            <DialogTitle className="font-bold text-xl">Manage Tags for <span className="text-orange-500">{tagsModalSiteLoc && tagsModalSiteLoc.location}</span> (<span className="text-gray-600">{tagsModalSiteLoc && tagsModalSiteLoc.site}</span>)</DialogTitle>
                            <Description className="text-sm text-gray-600">Select tags to assign or create new ones.</Description>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tagSearch}
                                    onChange={e => setTagSearch(e.target.value)}
                                    placeholder="Search tags..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={e => setNewTagName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreateTag() }}
                                    placeholder="New tag name..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                                <Button
                                    className="rounded bg-emerald-600 py-2 px-3 text-sm text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700 disabled:opacity-50"
                                    onClick={handleCreateTag}
                                    disabled={tagBusy || !newTagName.trim()}
                                >
                                    Add
                                </Button>
                            </div>

                            {tagBusy && allTags.length === 0 ? (
                                <div className="text-center text-gray-500 py-4">Loading tags...</div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
                                    {allTags.length === 0 ? (
                                        <div className="text-center text-gray-400 py-4 text-sm">No tags found.</div>
                                    ) : (
                                        allTags.map(tag => {
                                            const isAssigned = selectedTagIds.has(tag.id)
                                            return (
                                                <label
                                                    key={tag.id}
                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm group"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isAssigned}
                                                        onChange={() => toggleTag(tag.id)}
                                                        className="h-4 w-4 text-sky-600 rounded border-gray-300"
                                                    />
                                                    <span
                                                        className="inline-block w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: tag.color || '#6b7280' }}
                                                    />
                                                    <span className={`flex-1 ${isAssigned ? 'font-semibold' : 'text-gray-700'}`}>
                                                        {tag.name}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); setConfirmDeleteTagId(tag.id); setConfirmDeleteTagName(tag.name); }}
                                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-sm px-1 transition-opacity"
                                                        title="Delete tag"
                                                    >
                                                        &times;
                                                    </button>
                                                </label>
                                            )
                                        })
                                    )}
                                </div>
                            )}

                            {confirmDeleteTagId && (
                                <div className="rounded-md bg-red-50 border border-red-200 p-4 space-y-3">
                                    <p className="text-sm text-red-800">
                                        Delete tag <strong>{confirmDeleteTagName}</strong>? It will be removed from all assigned site-locations.
                                    </p>
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            className="rounded bg-gray-200 py-1.5 px-3 text-sm text-gray-800 data-[hover]:bg-gray-300"
                                            onClick={() => { setConfirmDeleteTagId(null); setConfirmDeleteTagName(''); }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="rounded bg-red-600 py-1.5 px-3 text-sm text-white data-[hover]:bg-red-500"
                                            onClick={handleDeleteTag}
                                            disabled={tagBusy}
                                        >
                                            {tagBusy ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-2">
                                <Button
                                    className="rounded bg-gray-600 py-2 px-4 text-sm text-white data-[hover]:bg-gray-500 data-[active]:bg-gray-700"
                                    onClick={() => setShowTagsModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="rounded bg-sky-600 py-2 px-4 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700 disabled:opacity-50"
                                    onClick={handleSaveTags}
                                    disabled={tagBusy}
                                >
                                    {tagBusy ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>

            <h1 className="text-xl font-bold text-left mb-4">Match Surfaces</h1>
            <Field >
                <div className="flex justify-start items-center">
                    <Label className="text-sm/6 font-medium">Site</Label>&nbsp;&nbsp;
                    <Select onChange={(e) => setSite(e.currentTarget.value)} value={site} className="rounded border-solid outline outline-gray-400 outline-2 w-64" >
                        <option value="">All</option>
                        {options}
                    </Select>
                    {site ? (
                        <div className="ml-4 text-sm font-medium flex items-center gap-2 flex-wrap">
                            <span>Selected: {site}</span>
                            <Button
                                className="rounded bg-sky-600 py-1 px-2 text-xs text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={openConfirmScrape}
                                disabled={scrapeTriggerLoading || scrapeStatusLoading || isScrapingRunning}
                            >
                                {scrapeTriggerLoading ? 'Refreshing...' : 'Refresh'}
                            </Button>
                            {scrapeStatusLoading && (
                                <span className="text-gray-500">(loading...)</span>
                            )}
                            {!scrapeStatusLoading && siteScrapingStatus && (
                                <>
                                    {siteScrapingStatus.status === 'running' && (
                                        <span className="text-blue-600 font-semibold">Running</span>
                                    )}
                                    {siteScrapingStatus.status === 'failed' && (
                                        <span className="text-red-600 font-semibold">Failed</span>
                                    )}
                                    {siteScrapingStatus.last_scraped_at && (
                                        <span className="text-gray-600 ml-2">
                                            (Last scraped: {new Date(siteScrapingStatus.last_scraped_at).toLocaleDateString()})
                                        </span>
                                    )}
                                    {siteScrapingStatus.status === 'failed' && siteScrapingStatus.error && (
                                        <Button
                                            className="rounded bg-red-100 text-red-700 py-1 px-2 text-xs hover:bg-red-200 ml-2"
                                            onClick={() => openErrorModal(siteScrapingStatus.error)}
                                        >
                                            View Errors
                                        </Button>
                                    )}
                                </>
                            )}
                            {siteConfig && (
                                <>
                                    <span className="text-gray-300 mx-1">|</span>
                                    <span className="text-xs text-gray-600">Readiness:</span>
                                    <select
                                        value={siteConfig.readiness_status}
                                        onChange={(e) => handleUpdateReadiness(siteConfig.id, parseInt(e.target.value))}
                                        className="text-xs border border-gray-300 rounded px-1 py-0.5"
                                    >
                                        <option value={0}>Pending</option>
                                        <option value={1}>In Progress</option>
                                        <option value={2}>Ready</option>
                                    </select>
                                    {readinessUpdateMsg && (
                                        <span className="text-xs text-emerald-600">{readinessUpdateMsg}</span>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <span className="ml-4 text-sm font-medium">All sites</span>
                    )}
                    {(site && site.startsWith('gs_')) && (
                        <span className="ml-auto text-sm text-gray-600">{eventsMatched} games matched | {gamesClaimed} games claimed</span>
                    )}
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
                        <div className="relative">
                            <input
                                type="text"
                                value={tagFilter}
                                onChange={e => {
                                    setTagFilter(e.target.value)
                                    if (selectedTag) setSelectedTag(null)
                                }}
                                onFocus={() => { if (tagSuggestions.length > 0) setShowTagSuggestions(true) }}
                                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                                className="px-2 py-1 pr-7 border border-gray-300 rounded-md"
                                placeholder={selectedTag ? '' : "Filter by tag..."}
                                disabled={isBusy}
                            />
                            {selectedTag && (
                                <button
                                    onClick={() => { setSelectedTag(null); setTagFilter(''); }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg leading-none px-1"
                                >
                                    &times;
                                </button>
                            )}
                            {showTagSuggestions && tagSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded shadow-md z-50 max-h-48 overflow-y-auto">
                                    {tagSuggestions.map(tag => (
                                        <button
                                            key={tag.id}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                            onMouseDown={() => {
                                                setSelectedTag(tag)
                                                setTagFilter(tag.name)
                                                setShowTagSuggestions(false)
                                            }}
                                        >
                                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: tag.color || '#6b7280' }} />
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleClearLocationFilter}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                            disabled={isBusy || (locationFilter === '' && !site)}
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
