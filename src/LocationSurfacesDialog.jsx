import { Button, Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import PropTypes from 'prop-types';

export default function LocationSurfacesDialog({ isOpen, setIsOpen, locationName, surfaces }) {
    let surfacesRows = [];
    if (surfaces && surfaces.length > 0) {
        surfacesRows = surfaces.map((surface) => (
            <tr key={surface.id} className="even:bg-gray-50 odd:bg-gray-200">
                <td className="text-left px-4 py-2">{surface.id}</td>
                <td className="text-left px-4 py-2">{surface.name}</td>
            </tr>
        ));
    }

    return (
        <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <DialogPanel className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg space-y-4 bg-white p-6 shadow-xl">
                    <DialogTitle className="text-xl font-bold text-left text-gray-900">
                        Surfaces for {locationName}
                    </DialogTitle>
                    <Description className="text-sm text-gray-500">
                       List of surfaces associated with this location.
                    </Description>

                    {surfaces && surfaces.length === 0 && (
                        <p className="text-gray-600 text-center mt-4">No surfaces found for this location.</p>
                    )}

                    {surfaces && surfaces.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {surfacesRows}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-4 flex justify-end">
                        <Button
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            onClick={() => setIsOpen(false)}
                        >
                            Close
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

LocationSurfacesDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    locationName: PropTypes.string,
    surfaces: PropTypes.array,
};
