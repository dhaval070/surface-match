import { useState, useEffect, useRef } from 'react'
import './App.css'
import { Field, Button, Select } from '@headlessui/react'
import { useAuth } from './AuthProvider.jsx'
import LocationDialog from './LocationDialog.jsx'
import MhrLbNotesDialog from './MhrLbNotesDialog.jsx'

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

export default function MHRLocations() {
    const [siteLoc, setSiteLoc] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [currSiteLoc, setCurrSiteLoc] = useState(null)
    const [isBusy, setBusy] = useState(false)
    const [selectorFor, setSelectorFor] = useState(null)
    const [isLocDiagOpen, setIsLocDiagOpen] = useState(false)
    const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
    const [editingMhrId, setEditingMhrId] = useState(null)
    const [editingNotes, setEditingNotes] = useState('')
    const [editingRinkName, setEditingRinkName] = useState('')

    const [nameFilter, setNameFilter] = useState('');
    const [provinceFilter, setprovinceFilter] = useState('');
    const [livebarnFilter, setLivebarnFilter] = useState('');
    const debouncedNameFilter = useDebounce(nameFilter, 500);
    const debouncedprovinceFilter = useDebounce(provinceFilter, 500);
    const debouncedLivebarnFilter = useDebounce(livebarnFilter, 500);


    const [pageSize, setPageSize] = useState(25)
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [sort, setSort] = useState('mhr_id');
    const [order, setOrder] = useState('asc');

    const handleSort = (column) => {
        if (sort === column) {
            setOrder(order === 'asc' ? 'desc' : 'asc');
        } else {
            setSort(column);
            setOrder('asc');
        }
        setPage(1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };
    const auth = useAuth()
    const api = auth.api
    const dropdownRef = useRef(null)

    const fetchData = async (api, page, pageSize, debouncedNameFilter, debouncedprovinceFilter, debouncedLivebarnFilter, sort, order) => {
        setBusy(true)
        const params = new URLSearchParams({
            page: page,
            perPage: pageSize,
            sort: sort,
            order: order,
        });
        if (debouncedNameFilter) {
            params.append('name', debouncedNameFilter);
        }
        if (debouncedprovinceFilter) {
            params.append('province', debouncedprovinceFilter);
        }
        if (debouncedLivebarnFilter) {
            params.append('livebarn_location_id', debouncedLivebarnFilter);
        }

        api.get(apiurl + `/mhr-locations?${params.toString()}`).then((resp) => {
            setTotal(resp.data.total || 0);
            setPageSize(resp.data.perPage || 10);
            setSiteLoc(resp.data.data)
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    };

    useEffect(function() {
        fetchData(api, page, pageSize, debouncedNameFilter, debouncedprovinceFilter, debouncedLivebarnFilter, sort, order);
    }, [api, page, pageSize, debouncedNameFilter, debouncedprovinceFilter, debouncedLivebarnFilter, sort, order]);


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
                setIsLocDiagOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        document.addEventListener('keydown', handleKey)
        return () => {
            document.removeEventListener('mousedown', handleOutside)
            document.removeEventListener('keydown', handleKey)
        }
    }, [dropdownRef, setIsOpen])

    useEffect(function() {
        if (!isOpen || !isLocDiagOpen) {
            setSelectorFor(null)
        }
    }, [isOpen, isLocDiagOpen])

    let assignLocation = function(rec) {
        setCurrSiteLoc(rec)
        setIsLocDiagOpen(true)
    }

    let locationSelected = function(id, siteloc) {
        setIsLocDiagOpen(false)
        setBusy(true)
        api.post(apiurl + "/mhr-set-location", {
            location_id: id,
            mhr_id: siteloc.mhr_id,
        }).then(() => fetchData(api, page, pageSize, debouncedNameFilter, debouncedprovinceFilter, debouncedLivebarnFilter, sort, order)).catch((e) => console.error(e)).finally(() => {
            setBusy(false)
        })
    }

    let openNotesDialog = function(rec) {
        setEditingMhrId(rec.mhr_id)
        setEditingRinkName(rec.rink_name)
        setEditingNotes(rec.lb_notes || '')
        setIsNotesDialogOpen(true)
    }

    const handleNotesSaveSuccess = () => {
        fetchData(api, page, pageSize, debouncedNameFilter, debouncedprovinceFilter, debouncedLivebarnFilter, sort, order)
    }

    const handleClearFilters = () => {
        setNameFilter('');
        setprovinceFilter('');
        setLivebarnFilter('');
        setPage(1);
    };

    const handleExport = () => {
        setBusy(true);
        const params = new URLSearchParams();
        params.append('sort', sort);
        params.append('order', order);
        if (debouncedNameFilter) {
            params.append('name', debouncedNameFilter);
        }
        if (debouncedprovinceFilter) {
            params.append('province', debouncedprovinceFilter);
        }
        if (debouncedLivebarnFilter) {
            params.append('livebarn_location_id', debouncedLivebarnFilter);
        }
        params.append('export', '1');
        api.get(apiurl + `/mhr-locations?${params.toString()}`, {
            responseType: 'blob'
        }).then((resp) => {
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `mhr-locations-${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        }).catch(e => console.error(e)).finally(() => setBusy(false));
    };

    const handlePrevPage = () => setPage(p => Math.max(1, p - 1))
    const handleNextPage = () => setPage(p => p + 1)
    const handleFirstPage = () => setPage(1)
    const handleLastPage = () => {
        setPage(Math.ceil(total / pageSize))
    }
    const totalPages = Math.ceil(total / pageSize);

    let unsetMapping = function(type, siteloc) {
        setBusy(true)
        api.post(apiurl + "/mhr-unset-mapping", {
            mhr_id: siteloc.mhr_id,
            type: type,
        }).then(() => fetchData(api, page, pageSize, debouncedNameFilter, debouncedprovinceFilter, debouncedLivebarnFilter, sort, order)).catch((e) => console.error(e)).finally(() => {
            setBusy(false)
        })
    }

    useEffect(() => {
        setPage(1);
    }, [debouncedNameFilter, debouncedprovinceFilter, debouncedLivebarnFilter, pageSize]);

    let rows = []

    if (siteLoc.length > 0) {
        const listStyle = {
            listStyleType: 'disc' // Use camelCase property name
        };
        rows = siteLoc.map(r => (
            <tr key={r.mhr_id} className="even:bg-gray-50 odd:bg-gray-200">
                <td className='text-left'>{r.mhr_id}</td>
                <td className="text-left">{r.rink_name}</td>
                <td className="text-left">{r.livebarn_installed == 1 ? "Yes" : ""}</td>
                <td className="text-left"><ul style={listStyle}>
                    {
                        r.home_teams && r.home_teams.map(hm => <li key={hm.url}><a href={hm.url}>{hm.label}</a></li>)
                    }
                </ul></td>

                <td className="text-left">{r.address}</td>
                <td className="text-left">{r.province}</td>
                <td className="text-left">
                    <div className="flex justify-between items-center">
                        <span>{r.livebarn_location_id}</span>
                    </div>
                </td>
                 <td className="text-left">{r.liveBarnLocation?.name}</td>
                  <td className="text-left">
                      <button 
                          onClick={() => openNotesDialog(r)}
                          className="text-sky-600 hover:text-sky-800 focus:outline-none"
                          title="Edit LiveBarn notes"
                      >
                          <i className="fas fa-edit"></i>
                      </button>
                  </td>
                  <td className="text-left">
                      {r.notes && (
                          <div className="group relative inline-block">
                               <i className="fas fa-sticky-note text-amber-600 hover:text-amber-700 cursor-pointer" title="MHR Notes"></i>
                               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64 max-h-48 overflow-y-auto p-2 bg-gray-900 text-white text-xs rounded shadow-lg border border-gray-700">
                                  <div className="whitespace-pre-wrap break-words">{r.notes}</div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                          </div>
                      )}
                  </td>
                    <td className="text-left">{formatDate(r.created_at)}</td>
                <td className="text-left whitespace-nowrap w-48">
                    <div className="relative inline-block overflow-visible" ref={selectorFor === r.location ? dropdownRef : null}>
                        <Button className="rounded bg-sky-600 py-2 px-2 text-xs text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700" onClick={() => setSelectorFor(selectorFor === r.mhr_id ? null : r.mhr_id)}>Change</Button>
                        {selectorFor === r.mhr_id && <div className="absolute right-0 mt-1 w-36 bg-white border rounded shadow-md flex flex-col" style={{ zIndex: 9999 }}>

                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={() => { assignLocation(r); }}>Location</button>
                        </div>}
                    </div>
                    &nbsp;&nbsp;
                    {r.livebarn_location_id != 0 &&
                        <Button className="rounded bg-amber-600 py-2 px-2 text-xs text-white data-[hover]:bg-amber-500 data-[active]:bg-amber-700" onClick={() => unsetMapping('location', r)}>Reset Location</Button>
                    }
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
            <LocationDialog api={api} siteLoc={currSiteLoc} isOpen={isLocDiagOpen} setIsOpen={setIsLocDiagOpen} locSelected={locationSelected} />
            <MhrLbNotesDialog api={api} isOpen={isNotesDialogOpen} setIsOpen={setIsNotesDialogOpen} mhrId={editingMhrId} rinkName={editingRinkName} initialNotes={editingNotes} onSaveSuccess={handleNotesSaveSuccess} />

            <div className="my-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4 items-center">
                        <input
                            type="text"
                            value={nameFilter}
                            onChange={e => setNameFilter(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md"
                            placeholder="Filter by name..."
                        />
                        <input
                            type="text"
                            value={provinceFilter}
                            onChange={e => setprovinceFilter(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md"
                            placeholder="Filter by province..."
                        />
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">LiveBarn:</label>
                            <Select
                                value={livebarnFilter}
                                onChange={e => setLivebarnFilter(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded-md"
                            >
                                <option value="">All</option>
                                <option value="1">Livebarn only</option>
                                <option value="0">No Livebarn</option>
                            </Select>
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                            disabled={isBusy || (nameFilter === '' && provinceFilter === '' && livebarnFilter === '')}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
                <div className="flex justify-end items-center gap-4">
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
                    </div>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
                        disabled={isBusy}
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            <Field className="my-5">
                <table className="bg-gray-100 w-full">
                    <thead className="sticky top-0">
                        <tr className="bg-slate-300">
                             <th onClick={() => handleSort('mhr_id')} className="cursor-pointer">MHR ID {sort === 'mhr_id' ? (order === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                            <th>Location</th>
                            <th>Has LiveBarn</th>
                            <th>Home Teams</th>
                            <th>Address</th>
                            <th>State/Province</th>
                            <th>Livebarn Location ID</th>
                              <th>Livebarn Location Name</th>
                               <th>LB Notes</th>
                               <th>MHR Notes</th>
                                <th onClick={() => handleSort('created_at')} className="cursor-pointer">Created At {sort === 'created_at' ? (order === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                              <th className="w-48">Actions</th>
                        </tr>

                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </Field >
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
                    <span>
                        Page {page} of {totalPages}
                    </span>
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
