import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './AuthProvider.jsx'
import { Field, Label, Input, Button, Dialog, DialogPanel, DialogTitle, Description, Textarea, Select } from '@headlessui/react'

const apiurl = import.meta.env.VITE_API_URL

export default function SitesConfig() {
    const [sitesConfigs, setSitesConfigs] = useState([])
    const [filteredConfigs, setFilteredConfigs] = useState([])
    const [isBusy, setBusy] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [editingConfig, setEditingConfig] = useState(null)
    const [parserTypeFilter, setParserTypeFilter] = useState('')
    const [parserTypes, setParserTypes] = useState([])
    const [formData, setFormData] = useState({
        site_name: '',
        display_name: '',
        base_url: '',
        home_team: '',
        parser_type: '',
        parser_config: '{}',
        enabled: true,
        scrape_frequency_hours: 24,
        notes: ''
    })
    const auth = useAuth()
    const api = auth.api

    useEffect(function() {
        loadSitesConfigs()
        loadParserTypes()
    }, [api])

    useEffect(function() {
        if (parserTypeFilter === '') {
            setFilteredConfigs(sitesConfigs)
        } else {
            setFilteredConfigs(sitesConfigs.filter(config => config.parser_type === parserTypeFilter))
        }
    }, [parserTypeFilter, sitesConfigs])

    const loadSitesConfigs = () => {
        setBusy(true)
        api.get(apiurl + "/sites-config").then((resp) => {
            setSitesConfigs(resp.data || [])
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    }

    const loadParserTypes = () => {
        api.get(apiurl + "/parser-types").then((resp) => {
            setParserTypes(resp.data || [])
        }).catch(e => console.error(e))
    }

    const openCreateDialog = () => {
        setEditingConfig(null)
        setFormData({
            site_name: '',
            display_name: '',
            base_url: '',
            home_team: '',
            parser_type: '',
            parser_config: '{}',
            enabled: true,
            scrape_frequency_hours: 24,
            notes: ''
        })
        setIsOpen(true)
    }

    const openEditDialog = (config) => {
        setEditingConfig(config)
        setFormData({
            site_name: config.site_name,
            display_name: config.display_name || '',
            base_url: config.base_url,
            home_team: config.home_team || '',
            parser_type: config.parser_type,
            parser_config: JSON.stringify(config.parser_config || {}, null, 2),
            enabled: config.enabled !== null ? config.enabled : true,
            scrape_frequency_hours: config.scrape_frequency_hours || 24,
            notes: config.notes || ''
        })
        setIsOpen(true)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setBusy(true)

        let parsedConfig = {}
        try {
            parsedConfig = JSON.parse(formData.parser_config || '{}')
        } catch (err) {
            alert('Invalid JSON in parser config: ' + err.message)
            setBusy(false)
            return
        }

        const payload = {
            site_name: formData.site_name,
            display_name: formData.display_name || null,
            base_url: formData.base_url,
            home_team: formData.home_team || null,
            parser_type: formData.parser_type,
            parser_config: parsedConfig,
            enabled: formData.enabled,
            scrape_frequency_hours: formData.scrape_frequency_hours ? parseInt(formData.scrape_frequency_hours) : null,
            notes: formData.notes || null
        }

        const request = editingConfig
            ? api.put(apiurl + "/sites-config/" + editingConfig.id, payload)
            : api.post(apiurl + "/sites-config", payload)

        request.then(() => {
            setIsOpen(false)
            loadSitesConfigs()
        }).catch((e) => {
            console.error(e)
            alert(e.response?.data?.error || 'An error occurred')
        }).finally(() => setBusy(false))
    }

    const handleDelete = (id) => {
        if (!confirm('Are you sure you want to delete this site configuration?')) {
            return
        }

        setBusy(true)
        api.delete(apiurl + "/sites-config/" + id).then(() => {
            loadSitesConfigs()
        }).catch((e) => {
            console.error(e)
            alert(e.response?.data?.error || 'An error occurred')
        }).finally(() => setBusy(false))
    }

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value })
    }

    let rows = []
    if (filteredConfigs.length > 0) {
        rows = filteredConfigs.map(config => (
            <tr key={config.id} className="even:bg-gray-50 odd:bg-gray-200">
                <td className="text-left px-2">{config.id}</td>
                <td className="text-left px-2">{config.site_name}</td>
                <td className="text-left px-2">{config.display_name || '-'}</td>
                <td className="text-left px-2 max-w-xs truncate" title={config.base_url}>{config.base_url}</td>
                <td className="text-left px-2">{config.parser_type}</td>
                <td className="text-left px-2">{config.enabled ? 'Yes' : 'No'}</td>
                <td className="text-left px-2">{config.last_scraped_at || '-'}</td>
                <td className="text-left px-2 whitespace-nowrap">
                    <Button className="rounded bg-sky-600 py-2 px-2 text-xs text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700" onClick={() => openEditDialog(config)}>Edit</Button>
                    &nbsp;
                    <Button className="rounded bg-red-600 py-2 px-2 text-xs text-white data-[hover]:bg-red-500 data-[active]:bg-red-700" onClick={() => handleDelete(config.id)}>Delete</Button>
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

            <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
                <div className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4">
                    <DialogPanel className="max-w-2xl w-full max-h-[90vh] overflow-auto space-y-4 border bg-white p-6 rounded">
                        <DialogTitle className="font-bold text-xl">
                            {editingConfig ? 'Edit Site Configuration' : 'Create Site Configuration'}
                        </DialogTitle>
                        <Description className="text-sm text-gray-600">
                            {editingConfig ? 'Update the site configuration details below.' : 'Enter the details for the new site configuration.'}
                        </Description>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Field>
                                <Label className="text-sm font-medium">Site Name *</Label>
                                <Input
                                    required
                                    value={formData.site_name}
                                    onChange={(e) => handleChange('site_name', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </Field>

                            <Field>
                                <Label className="text-sm font-medium">Display Name</Label>
                                <Input
                                    value={formData.display_name}
                                    onChange={(e) => handleChange('display_name', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </Field>

                            <Field>
                                <Label className="text-sm font-medium">Base URL *</Label>
                                <Input
                                    required
                                    type="url"
                                    value={formData.base_url}
                                    onChange={(e) => handleChange('base_url', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </Field>

                            <Field>
                                <Label className="text-sm font-medium">Home Team</Label>
                                <Input
                                    value={formData.home_team}
                                    onChange={(e) => handleChange('home_team', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </Field>

                            <Field>
                                <Label className="text-sm font-medium">Parser Type *</Label>
                                <Select
                                    required
                                    value={formData.parser_type}
                                    onChange={(e) => handleChange('parser_type', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                >
                                    <option value="">Select Parser Type</option>
                                    {parserTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </Select>
                            </Field>

                            <Field>
                                <Label className="text-sm font-medium">Parser Config (JSON)</Label>
                                <Textarea
                                    value={formData.parser_config}
                                    onChange={(e) => handleChange('parser_config', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
                                    rows={4}
                                />
                            </Field>

                            <Field>
                                <Label className="text-sm font-medium flex items-center">Enabled</Label>
                                <input
                                    type="checkbox"
                                    checked={formData.enabled}
                                    onChange={(e) => handleChange('enabled', e.target.checked)}
                                    className="mr-2 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                            </Field>

                            <Field>
                                <Label className="text-sm font-medium">Scrape Frequency (Hours)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.scrape_frequency_hours}
                                    onChange={(e) => handleChange('scrape_frequency_hours', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />
                            </Field>

                            <Field>
                                <Label className="text-sm font-medium">Notes</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                    rows={3}
                                />
                            </Field>

                            <div className="flex gap-4 pt-4">
                                <Button type="submit" className="rounded bg-emerald-600 py-2 px-4 text-sm text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700">
                                    {editingConfig ? 'Update' : 'Create'}
                                </Button>
                                <Button type="button" onClick={() => setIsOpen(false)} className="rounded bg-gray-600 py-2 px-4 text-sm text-white data-[hover]:bg-gray-500 data-[active]:bg-gray-700">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>

            <h1 className="text-xl font-bold text-left mb-4">Sites Configuration</h1>

            <div className="mb-4 flex justify-between items-center">
                <Field className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">Parser Type</Label>
                    <Select 
                        value={parserTypeFilter} 
                        onChange={(e) => setParserTypeFilter(e.target.value)}
                        className="rounded border border-gray-300 px-3 py-2 text-sm"
                    >
                        <option value="">All</option>
                        {parserTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Select>
                </Field>
                <Button className="rounded bg-emerald-600 py-2 px-4 text-sm text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700" onClick={openCreateDialog}>
                    Add New Site
                </Button>
            </div>

            <Field>
                <table className="table-auto bg-gray-100 w-full">
                    <thead className="sticky top-0">
                        <tr className="bg-slate-300">
                            <th className="px-2">ID</th>
                            <th className="px-2">Site Name</th>
                            <th className="px-2">Display Name</th>
                            <th className="px-2">Base URL</th>
                            <th className="px-2">Parser Type</th>
                            <th className="px-2">Enabled</th>
                            <th className="px-2">Last Scraped</th>
                            <th className="px-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </Field>
        </div>
    )
}
