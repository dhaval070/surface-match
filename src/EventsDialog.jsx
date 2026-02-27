import { Button, Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

const apiurl = import.meta.env.VITE_API_URL;

export default function EventsDialog({ isOpen, setIsOpen, locationId, locationName, startDate, endDate, api }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (isOpen && locationId && api) {
            fetchEvents();
        } else if (!isOpen) {
            // Clear data when dialog is closed
            setEvents([]);
            setCount(0);
        }
    }, [isOpen, locationId, startDate, endDate, api, fetchEvents]);

    const fetchEvents = useCallback(() => {
        if (!api) return;
        
        setLoading(true);
        const params = new URLSearchParams();
        
        if (locationId) {
            params.append('location_id', locationId);
        }
        if (startDate) {
            params.append('start_date', startDate);
        }
        if (endDate) {
            params.append('end_date', endDate);
        }

        console.log("Fetching events:", `${apiurl}/events-by-date?${params.toString()}`);

        api.get(`${apiurl}/events-by-date?${params.toString()}`)
            .then((resp) => {
                console.log("Events response:", resp.data);
                setEvents(resp.data.data || []);
                setCount(resp.data.count || 0);
            })
            .catch((error) => {
                console.error("Error fetching events:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [api, locationId, startDate, endDate, setLoading, setEvents, setCount]);

    let eventsRows = [];
    if (events && events.length > 0) {
        eventsRows = events.map((event, index) => (
            <tr key={event.id || index} className="even:bg-gray-50 odd:bg-gray-200">
                <td className="text-left px-4 py-2">{event.id}</td>
                <td className="text-left px-4 py-2">{event.site}</td>
                <td className="text-left px-4 py-2">{event.display_name}</td>
                <td className="text-left px-4 py-2">{new Date(event.datetime).toLocaleString()}</td>
                <td className="text-left px-4 py-2">{event.home_team}</td>
                <td className="text-left px-4 py-2">{event.guest_team}</td>
                <td className="text-left px-4 py-2">{event.location}</td>
                <td className="text-left px-4 py-2">{event.surface_name}</td>
            </tr>
        ));
    }

    return (
        <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <DialogPanel className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg space-y-4 bg-white p-6 shadow-xl">
                    <DialogTitle className="text-xl font-bold text-left text-gray-900">
                        Events for {locationName}
                    </DialogTitle>
                    <Description className="text-sm text-gray-500">
                        Showing events from {startDate} to {endDate}. Total: {count}
                    </Description>

                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <div className="fas fa-circle-notch fa-spin fa-3x text-violet-600"></div>
                        </div>
                    )}

                    {!loading && events.length === 0 && (
                        <p className="text-gray-600 text-center mt-4">No events found for this location.</p>
                    )}

                    {!loading && events.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="table-auto bg-gray-100 w-full">
                                <thead className="sticky top-0">
                                    <tr className="bg-slate-300">
                                        <th className="px-4 py-2">ID</th>
                                        <th className="px-4 py-2">Site</th>
                                        <th className="px-4 py-2">Display Name</th>
                                        <th className="px-4 py-2">Date/Time</th>
                                        <th className="px-4 py-2">Home Team</th>
                                        <th className="px-4 py-2">Guest Team</th>
                                        <th className="px-4 py-2">Location</th>
                                        <th className="px-4 py-2">Surface Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventsRows}
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

EventsDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    locationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    locationName: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    api: PropTypes.any.isRequired,
};
