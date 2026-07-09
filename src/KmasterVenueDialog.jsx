import { useState, useEffect } from 'react'
import { Button } from '@headlessui/react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import PropTypes from 'prop-types'

const apiurl = import.meta.env.VITE_API_URL

KmasterVenueDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func,
    api: PropTypes.func,
    venue: PropTypes.object,
    onSave: PropTypes.func,
}

const emptyForm = {
    venue_name: '',
    venue_type: '',
    account_status: '',
    city: '',
    province_state: '',
    country: '',
    rink_address: '',
    postal_code: '',
    phone_number: '',
    website: '',
    parent_company: '',
    company_name_alt1: '',
    company_name_alt2: '',
    company_name_alt3: '',
    streaming_platform: '',
    surfaces: '',
    livebarn_venue_id: '',
    mhr_venue_id: '',
    latitude: '',
    longitude: '',
}

export default function KmasterVenueDialog(props) {
    const [form, setForm] = useState(emptyForm)
    const [isBusy, setBusy] = useState(false)

    useEffect(() => {
        if (props.isOpen) {
            if (props.venue) {
                setForm({
                    venue_name: props.venue.venue_name || '',
                    venue_type: props.venue.venue_type || '',
                    account_status: props.venue.account_status || '',
                    city: props.venue.city || '',
                    province_state: props.venue.province_state || '',
                    country: props.venue.country || '',
                    rink_address: props.venue.rink_address || '',
                    postal_code: props.venue.postal_code || '',
                    phone_number: props.venue.phone_number || '',
                    website: props.venue.website || '',
                    parent_company: props.venue.parent_company || '',
                    company_name_alt1: props.venue.company_name_alt1 || '',
                    company_name_alt2: props.venue.company_name_alt2 || '',
                    company_name_alt3: props.venue.company_name_alt3 || '',
                    streaming_platform: props.venue.streaming_platform || '',
                    surfaces: props.venue.surfaces ?? '',
                    livebarn_venue_id: props.venue.livebarn_venue_id ?? '',
                    mhr_venue_id: props.venue.mhr_venue_id ?? '',
                    latitude: props.venue.latitude ?? '',
                    longitude: props.venue.longitude ?? '',
                })
            } else {
                setForm(emptyForm)
            }
        }
    }, [props.isOpen, props.venue])

    if (!props.api) return <></>
    const api = props.api

    const isEditing = !!props.venue

    const renderMatchIcon = (matched) => {
        if (matched === true) return <span className="fas fa-check-circle text-green-600 ml-1" title="Matched" />
        if (matched === false) return <span className="fas fa-times-circle text-red-600 ml-1" title="Not matched" />
        return null
    }

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const buildPayload = () => {
        const p = { ...form }
        p.surfaces = p.surfaces === '' ? null : Number(p.surfaces)
        p.livebarn_venue_id = p.livebarn_venue_id === '' ? null : Number(p.livebarn_venue_id)
        p.mhr_venue_id = p.mhr_venue_id === '' ? null : Number(p.mhr_venue_id)
        p.latitude = p.latitude === '' ? null : Number(p.latitude)
        p.longitude = p.longitude === '' ? null : Number(p.longitude)
        return p
    }

    const handleSave = () => {
        if (!form.venue_name.trim()) return
        setBusy(true)
        const payload = buildPayload()

        const request = isEditing
            ? api.put(`${apiurl}/kmaster-venues/${props.venue.id}`, payload)
            : api.post(`${apiurl}/kmaster-venues`, payload)

        request.then(() => {
            if (props.onSave) props.onSave()
        }).catch(e => {
            console.error("Save error:", e)
        }).finally(() => {
            setBusy(false)
        })
    }

    return (
        <Dialog open={props.isOpen} onClose={() => props.setIsOpen(false)} className="relative z-50">
            <div className="fixed inset-0 flex w-screen justify-center bg-white p-4">
                <div className="flex items-start justify-center pt-8">
                    <DialogPanel className="w-full max-w-2xl max-h-[85vh] overflow-auto space-y-3 border bg-white p-6 rounded-lg">
                        <DialogTitle className="font-bold text-lg">
                            {isEditing ? 'Edit Venue' : 'Add Venue'}
                        </DialogTitle>
                        <style>{`
                            .no-spin::-webkit-inner-spin-button,
                            .no-spin::-webkit-outer-spin-button {
                                -webkit-appearance: none;
                                margin: 0;
                            }
                            .no-spin[type="number"] {
                                -moz-appearance: textfield;
                            }
                        `}</style>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-3">
                                <label className="block text-sm font-medium mb-1">Venue Name *</label>
                                <input
                                    type="text"
                                    value={form.venue_name}
                                    onChange={e => handleChange('venue_name', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Venue Type</label>
                                <input
                                    type="text"
                                    value={form.venue_type}
                                    onChange={e => handleChange('venue_type', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Account Status</label>
                                <input
                                    type="text"
                                    value={form.account_status}
                                    onChange={e => handleChange('account_status', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">City</label>
                                <input
                                    type="text"
                                    value={form.city}
                                    onChange={e => handleChange('city', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Province/State</label>
                                <input
                                    type="text"
                                    value={form.province_state}
                                    onChange={e => handleChange('province_state', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Country</label>
                                <input
                                    type="text"
                                    value={form.country}
                                    onChange={e => handleChange('country', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Postal Code</label>
                                <input
                                    type="text"
                                    value={form.postal_code}
                                    onChange={e => handleChange('postal_code', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Latitude</label>
                                <input
                                    type="number"
                                    value={form.latitude}
                                    onChange={e => handleChange('latitude', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2 no-spin"
                                    step="any"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Longitude</label>
                                <input
                                    type="number"
                                    value={form.longitude}
                                    onChange={e => handleChange('longitude', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2 no-spin"
                                    step="any"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={form.phone_number}
                                    onChange={e => handleChange('phone_number', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Website</label>
                                <input
                                    type="text"
                                    value={form.website}
                                    onChange={e => handleChange('website', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Parent Company</label>
                                <input
                                    type="text"
                                    value={form.parent_company}
                                    onChange={e => handleChange('parent_company', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Streaming Platform</label>
                                <input
                                    type="text"
                                    value={form.streaming_platform}
                                    onChange={e => handleChange('streaming_platform', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-sm font-medium mb-1">Rink Address</label>
                                <input
                                    type="text"
                                    value={form.rink_address}
                                    onChange={e => handleChange('rink_address', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Company Alt 1</label>
                                <input
                                    type="text"
                                    value={form.company_name_alt1}
                                    onChange={e => handleChange('company_name_alt1', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Company Alt 2</label>
                                <input
                                    type="text"
                                    value={form.company_name_alt2}
                                    onChange={e => handleChange('company_name_alt2', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Company Alt 3</label>
                                <input
                                    type="text"
                                    value={form.company_name_alt3}
                                    onChange={e => handleChange('company_name_alt3', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2 no-spin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Surfaces</label>
                                <input
                                    type="number"
                                    value={form.surfaces}
                                    onChange={e => handleChange('surfaces', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2 no-spin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">LiveBarn Venue ID {props.venue ? renderMatchIcon(props.venue.livebarn_venue_id_matched) : null}</label>
                                <input
                                    type="number"
                                    value={form.livebarn_venue_id}
                                    onChange={e => handleChange('livebarn_venue_id', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2 no-spin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">MHR Venue ID {props.venue ? renderMatchIcon(props.venue.mhr_venue_id_matched) : null}</label>
                                <input
                                    type="number"
                                    value={form.mhr_venue_id}
                                    onChange={e => handleChange('mhr_venue_id', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2 no-spin"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 justify-end pt-4">
                            <Button
                                className="rounded bg-gray-300 py-2 px-4 text-sm text-gray-800 data-[hover]:bg-gray-400"
                                onClick={() => props.setIsOpen(false)}
                                disabled={isBusy}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="rounded bg-sky-600 py-2 px-4 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700"
                                onClick={handleSave}
                                disabled={isBusy || !form.venue_name.trim()}
                            >
                                {isBusy ? (
                                    <><span className="fas fa-circle-notch fa-spin mr-2"></span>Saving...</>
                                ) : (isEditing ? 'Update' : 'Create')}
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
