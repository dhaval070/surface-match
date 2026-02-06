import { useState, useEffect } from 'react'
import { Button } from '@headlessui/react'
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import PropTypes from 'prop-types';

const apiurl = import.meta.env.VITE_API_URL;

LocationDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func,
    locSelected: PropTypes.func,
    api: PropTypes.func,
    siteLoc: PropTypes.object,
}

export default function LocationDialog(props) {
    const [locations, setLocations] = useState([])
    const [isBusy, setBusy] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState(null)
    const [nameFilter, setNameFilter] = useState('')
    const [debouncedNameFilter, setDebouncedNameFilter] = useState(nameFilter)

    useEffect(function() {
        if (!props.api || !props.isOpen) return
        setBusy(true)

        const params = { page: currentPage, perPage: 10 }

        if (debouncedNameFilter) params.name = debouncedNameFilter

        props.api.get(apiurl + "/locations", { params }).then((resp) => {
            setLocations(resp.data.data || [])
            setPagination(resp.data)
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    }, [props.api, props.isOpen, currentPage, debouncedNameFilter])

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedNameFilter(nameFilter), 500)
        return () => clearTimeout(handler)
    }, [nameFilter])

    useEffect(() => {
        // reset to first page whenever filter changes
        setCurrentPage(1)
    }, [debouncedNameFilter])

    const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1))
    const handleNextPage = () => setCurrentPage(p => p + 1)
    const handleFirstPage = () => setCurrentPage(1)
    const handleLastPage = () => {
        const currPage = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1
        setCurrentPage(currPage)
    }
    const totalPages = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1

    return (
        <>
            <Dialog open={props.isOpen} onClose={() => props.setIsOpen(false)} className="relative z-50">
                <div className="fixed inset-0 flex w-screen justify-center bg-white p-4">
                    <div className="flex items-center justify-center ">
                        <DialogPanel className=" w-max  h-full overflow-auto  space-y-2 border bg-white p-2">
                            <DialogTitle className="font-bold">Select location for <span className="text-orange-500">{}</span></DialogTitle>
                            <Description></Description>

                            <div className="flex items-center justify-between mb-2">
                                <input type="text" value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder="Filter by name..." className="px-2 py-1 border rounded-md w-64" />
                                <div className="text-sm text-gray-600">Showing {pagination && pagination.total} results</div>
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
                                            <td className="border"><a href="#" className="font-bold text-blue-600 hover:text-blue-400" onClick={() => props.locSelected(l.id, props.siteLoc)}>{l.id}</a></td>
                                            <td className="border">{l.name}</td>
                                            <td className="border">{l.city}</td>
                                            <td className="border">{l.postal_code}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {pagination && pagination.total > pagination.perPage && (
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
                                <Button className="rounded bg-sky-600 py-2 px-4 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700" onClick={() => props.setIsOpen(false)}>Cancel</Button>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}
