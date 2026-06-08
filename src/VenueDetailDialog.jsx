import PropTypes from 'prop-types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

function renderValue(v) {
    if (v === null || v === undefined) return <span className="text-gray-400">N/A</span>
    if (typeof v === 'boolean') return <span>{v ? 'Yes' : 'No'}</span>
    if (Array.isArray(v)) {
        if (v.length === 0) return <span className="text-gray-400">None</span>
        return (
            <ul className="list-disc list-inside">
                {v.map((item, i) => {
                    if (typeof item === 'object') return <li key={i}>{JSON.stringify(item)}</li>
                    return <li key={i}>{String(item)}</li>
                })}
            </ul>
        )
    }
    if (typeof v === 'object') return <span>{JSON.stringify(v)}</span>
    return String(v)
}

VenueDetailDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    data: PropTypes.object,
    isBusy: PropTypes.bool,
    title: PropTypes.string,
}

export default function VenueDetailDialog({ isOpen, setIsOpen, data, isBusy, title }) {
    return (
        <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
            <div className="fixed inset-0 flex w-screen justify-center bg-black bg-opacity-50 p-4">
                <div className="flex items-center justify-center">
                    <DialogPanel className="w-full max-w-2xl max-h-[80vh] overflow-auto space-y-4 border bg-white p-6 rounded-lg shadow-xl">
                        <DialogTitle className="text-lg font-bold">{title || 'Details'}</DialogTitle>

                        {isBusy && (
                            <div className="flex justify-center py-8">
                                <div className="fas fa-circle-notch fa-spin fa-3x text-violet-600"></div>
                            </div>
                        )}

                        {!isBusy && data && (
                            <table className="table-auto w-full border">
                                <tbody>
                                    {Object.entries(data).map(([key, value]) => {
                                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                            let nestedRows = []
                                            for (const [nk, nv] of Object.entries(value)) {
                                                nestedRows.push(
                                                    <tr key={`${key}.${nk}`} className="even:bg-gray-50 odd:bg-gray-200">
                                                        <td className="border px-3 py-1.5 text-sm font-medium text-gray-600 w-1/3 pl-8">
                                                            {key}.{nk}
                                                        </td>
                                                        <td className="border px-3 py-1.5 text-sm">{renderValue(nv)}</td>
                                                    </tr>
                                                )
                                            }
                                            return nestedRows
                                        }
                                        return (
                                            <tr key={key} className="even:bg-gray-50 odd:bg-gray-200">
                                                <td className="border px-3 py-1.5 text-sm font-medium text-gray-600 w-1/3">{key}</td>
                                                <td className="border px-3 py-1.5 text-sm">{renderValue(value)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}

                        {!isBusy && !data && (
                            <p className="text-gray-500 text-center py-4">No data available</p>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-500 text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
