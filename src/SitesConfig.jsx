import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { useAuth } from './AuthProvider.jsx'
import { Link } from 'react-router-dom'
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
    const [searchText, setSearchText] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [enabledFilter, setEnabledFilter] = useState('')
    const [sortColumn, setSortColumn] = useState('')
    const [sortOrder, setSortOrder] = useState('asc')
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [seasons, setSeasons] = useState([])
    const [selectedSeasonIds, setSelectedSeasonIds] = useState(new Set())
    const [isImporting, setIsImporting] = useState(false)
    const [tagFilter, setTagFilter] = useState('')
    const [selectedTag, setSelectedTag] = useState(null)
    const [tagSuggestions, setTagSuggestions] = useState([])
    const [showTagSuggestions, setShowTagSuggestions] = useState(false)
    const [showTagsModal, setShowTagsModal] = useState(false)
    const [tagsModalSite, setTagsModalSite] = useState(null)
    const [allTags, setAllTags] = useState([])
    const [selectedTagIds, setSelectedTagIds] = useState(new Set())
    const [originalTagIds, setOriginalTagIds] = useState(new Set())
    const [tagSearch, setTagSearch] = useState('')
    const [tagBusy, setTagBusy] = useState(false)
    const [newTagName, setNewTagName] = useState('')
    const [confirmDeleteTagId, setConfirmDeleteTagId] = useState(null)
    const [confirmDeleteTagName, setConfirmDeleteTagName] = useState('')
    const [formData, setFormData] = useState({
        site_name: '',
        display_name: '',
        base_url: '',
        home_team: '',
        parser_type: '',
        parser_config: '{}',
        enabled: true,
        scrape_frequency_hours: 24,
        notes: '',
        readiness_status: 0
    })
    const auth = useAuth()
    const api = auth.api

    useEffect(function() {
        if (parserTypeFilter === '') {
            setFilteredConfigs(sitesConfigs)
        } else {
            setFilteredConfigs(sitesConfigs.filter(config => config.parser_type === parserTypeFilter))
        }
    }, [parserTypeFilter, sitesConfigs])

    useEffect(function() {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchText])

    useEffect(function() {
        const timer = setTimeout(() => {
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
        return () => clearTimeout(timer)
    }, [tagFilter, selectedTag, api])

    const loadSitesConfigs = useCallback(() => {
        setBusy(true)
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (enabledFilter) params.set('enabled', enabledFilter)
        if (selectedTag) params.set('tag', selectedTag.name)
        if (sortColumn) params.set('sort', sortColumn)
        if (sortOrder) params.set('order', sortOrder)
        const qs = params.toString()
        api.get(apiurl + "/sites-config" + (qs ? '?' + qs : '')).then((resp) => {
            setSitesConfigs(resp.data || [])
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    }, [api, setBusy, setSitesConfigs, debouncedSearch, enabledFilter, selectedTag, sortColumn, sortOrder])

    const loadParserTypes = useCallback(() => {
        api.get(apiurl + "/parser-types").then((resp) => {
            setParserTypes(resp.data || [])
        }).catch(e => console.error(e))
    }, [api, setParserTypes])

    const fetchAllTags = useCallback((q) => {
        api.get(apiurl + "/tags", { params: q ? { q } : {} }).then((resp) => {
            setAllTags(resp.data || [])
        }).catch(e => console.error('Failed to fetch tags:', e))
    }, [api])

    const fetchAssignedTags = useCallback((siteName) => {
        if (!siteName) return
        api.get(apiurl + "/sites-tags", { params: { site_name: siteName } }).then((resp) => {
            const ids = new Set((resp.data || []).map(t => t.id))
            setSelectedTagIds(ids)
            setOriginalTagIds(new Set(ids))
        }).catch(e => console.error('Failed to fetch assigned tags:', e))
    }, [api])

    const openTagsModal = useCallback((siteName) => {
        setTagsModalSite(siteName)
        setTagSearch('')
        setNewTagName('')
        setShowTagsModal(true)
    }, [])

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
        if (!tagsModalSite) return
        setTagBusy(true)
        const siteName = tagsModalSite
        const toAdd = [...selectedTagIds].filter(id => !originalTagIds.has(id))
        const toRemove = [...originalTagIds].filter(id => !selectedTagIds.has(id))
        const promises = []
        if (toAdd.length > 0) {
            promises.push(api.post(apiurl + "/sites-tags", { tag_ids: toAdd }, { params: { site_name: siteName } }))
        }
        toRemove.forEach(id => {
            promises.push(api.delete(apiurl + "/sites-tags", { params: { site_name: siteName, tag_id: id } }))
        })
        Promise.all(promises).then(() => {
            setShowTagsModal(false)
            loadSitesConfigs()
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
            loadSitesConfigs()
        }).catch(e => console.error('Failed to delete tag:', e)).finally(() => setTagBusy(false))
    }

    useEffect(function() {
        loadSitesConfigs()
        loadParserTypes()
    }, [api, loadSitesConfigs, loadParserTypes])

    useEffect(() => {
        if (!showTagsModal || !tagsModalSite) return
        setTagBusy(true)
        Promise.all([
            fetchAllTags(),
            fetchAssignedTags(tagsModalSite)
        ]).finally(() => setTagBusy(false))
    }, [showTagsModal, tagsModalSite, fetchAllTags, fetchAssignedTags])

    useEffect(() => {
        if (!showTagsModal) return
        const handler = setTimeout(() => {
            fetchAllTags(tagSearch || undefined)
        }, 300)
        return () => clearTimeout(handler)
    }, [tagSearch, showTagsModal, fetchAllTags])

    const openImportDialog = () => {
        setIsImportDialogOpen(true)
        setIsImporting(true)
        setSeasons([])
        setSelectedSeasonIds(new Set())
        api.get(apiurl + "/gamesheet-seasons?exclude_existing=true&source=csv").then((resp) => {
            setSeasons(resp.data || [])
        }).catch(e => {
            console.error(e)
            alert(e.response?.data?.error || 'Failed to load seasons')
        }).finally(() => setIsImporting(false))
    }

    const handleImport = () => {
        const selectedSeasons = seasons.filter(s => selectedSeasonIds.has(s.id))
        if (selectedSeasons.length === 0) return

        setIsImporting(true)
        api.post(apiurl + "/gamesheet-seasons/import", selectedSeasons).then(() => {
            setIsImportDialogOpen(false)
            loadSitesConfigs()
        }).catch(e => {
            console.error(e)
            alert(e.response?.data?.error || 'Import failed')
        }).finally(() => setIsImporting(false))
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
            notes: '',
            readiness_status: 0
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
            notes: config.notes || '',
            readiness_status: config.readiness_status ?? null
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
            base_url: formData.base_url || null,
            home_team: formData.home_team || null,
            parser_type: formData.parser_type,
            parser_config: parsedConfig,
            enabled: formData.enabled,
            readiness_status: parseInt(formData.readiness_status),
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

    const handleToggle = (id, enabled) => {
        const action = enabled ? 'disable' : 'enable'
        if (!confirm(`Are you sure you want to ${action} this site configuration?`)) {
            return
        }
        setBusy(true)
        api.post(apiurl + "/sites-config/" + id + "/toggle").then(() => {
            loadSitesConfigs()
        }).catch((e) => {
            console.error(e)
            alert(e.response?.data?.error || 'An error occurred')
        }).finally(() => setBusy(false))
    }

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value })
    }

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortOrder('asc')
        }
    }

    const sortIndicator = (column) => {
        if (sortColumn !== column) return ''
        return sortOrder === 'asc' ? ' ▲' : ' ▼'
    }

    let rows = []
    if (filteredConfigs.length > 0) {
        rows = filteredConfigs.map(config => (
            <tr key={config.id} className="even:bg-gray-50 odd:bg-gray-200">
                <td className="text-left px-2">{config.id}</td>
                <td className="text-left px-2">
                    {config.readiness_status === 2
                        ? <span className="fas fa-check-circle text-emerald-600 mr-1" title="Ready" />
                        : config.readiness_status === 1
                            ? <span className="fas fa-spinner fa-spin text-amber-500 mr-1" title="In Progress" />
                            : config.readiness_status === 0
                                ? <span className="fas fa-hourglass text-gray-400 mr-1" title="Pending" />
                                : null}
                    <Link to={`/?site=${encodeURIComponent(config.site_name)}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {config.site_name}{config.league_name ? ` (${config.league_name})` : ''}
                    </Link>
                </td>
                <td className="text-left px-2">{config.display_name || '-'}</td>
                <td className="text-left px-2 max-w-xs truncate" title={config.base_url}>{config.base_url}</td>
                <td className="text-left px-2">{config.parser_type}</td>
                <td className="text-left px-2">{config.enabled ? 'Yes' : <span className="text-red-600">No</span>}</td>
                <td className="text-left px-2">{config.last_scraped_at || '-'}</td>
                <td className="text-left px-2">
                    <Link to={`/events?site=${encodeURIComponent(config.site_name)}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {config.games_scraped || '-'}
                    </Link>
                </td>
                <td className="text-left px-2">{config.games_imported || '-'}</td>
                <td className="text-left px-2">
                    <div className="flex flex-col gap-1">
                        <Button className={`rounded py-2 px-2 text-xs text-white data-[hover]:bg-opacity-80 data-[active]:bg-opacity-100 ${config.enabled ? 'bg-amber-600 data-[hover]:bg-amber-500 data-[active]:bg-amber-700' : 'bg-emerald-600 data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700'}`} onClick={() => handleToggle(config.id, config.enabled)}>
                            {config.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button className="rounded bg-sky-600 py-2 px-2 text-xs text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700" onClick={() => openEditDialog(config)}>Edit</Button>
                        <Button className="rounded bg-purple-600 py-2 px-2 text-xs text-white data-[hover]:bg-purple-500 data-[active]:bg-purple-700" onClick={() => openTagsModal(config.site_name)}>Tags</Button>
                        <Button className="rounded bg-red-600 py-2 px-2 text-xs text-white data-[hover]:bg-red-500 data-[active]:bg-red-700" onClick={() => handleDelete(config.id)}>Delete</Button>
                    </div>
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
                                    readOnly={!!editingConfig}
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
                                <Label className="text-sm font-medium">Base URL</Label>
                                <Input
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
                                <Label className="text-sm font-medium whitespace-nowrap">Parser Type *</Label>
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

                            <Field>
                                <Label className="text-sm font-medium">Readiness Status</Label>
                                <Select
                                    value={formData.readiness_status}
                                    onChange={(e) => handleChange('readiness_status', parseInt(e.target.value))}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                >
                                    <option value="0">Pending</option>
                                    <option value="1">In Progress</option>
                                    <option value="2">Ready</option>
                                </Select>
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

            <Dialog open={isImportDialogOpen} onClose={() => setIsImportDialogOpen(false)} className="relative z-50">
                <div className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4">
                    <DialogPanel className="max-w-3xl w-full max-h-[90vh] overflow-auto space-y-4 border bg-white p-6 rounded">
                        <DialogTitle className="font-bold text-xl">
                            Import Gamesheet Seasons
                        </DialogTitle>
                        <Description className="text-sm text-gray-600">
                            Select seasons to import as site configurations.
                        </Description>

                        {seasons.length === 0 && !isImporting && (
                            <p className="text-gray-500">No seasons available.</p>
                        )}

                        {isImporting && seasons.length === 0 && (
                            <div className="flex justify-center items-center py-8">
                                <div className="fas fa-circle-notch fa-spin fa-3x text-blue-600"></div>
                            </div>
                        )}

                        {seasons.length > 0 && (
                            <div className="space-y-2 max-h-96 overflow-y-auto border rounded p-2">
                                {seasons.map(season => (
                                    <label key={season.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedSeasonIds.has(season.id)}
                                            onChange={(e) => {
                                                const next = new Set(selectedSeasonIds)
                                                if (e.target.checked) {
                                                    next.add(season.id)
                                                } else {
                                                    next.delete(season.id)
                                                }
                                                setSelectedSeasonIds(next)
                                            }}
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="text-sm">
                                            <div className="font-medium">#{season.id} - {season.title}</div>
                                            <div className="text-gray-500">
                                                {season.leagueId && <span>League ID: {season.leagueId} · </span>}
                                                {season.start && season.end
                                                    ? `${season.start} to ${season.end}`
                                                    : season.start || season.end || ''}
                                                {season.age_category && <span> · {season.age_category}</span>}
                                                {season.game_type && <span> · {season.game_type}</span>}
                                                {season.state_province && <span> · {season.state_province}</span>}
                                                {season.country && <span> · {season.country}</span>}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <Button
                                className="rounded bg-blue-600 py-2 px-4 text-sm text-white data-[hover]:bg-blue-500 data-[active]:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleImport}
                                disabled={selectedSeasonIds.size === 0 || isImporting}
                            >
                                {isImporting ? 'Importing...' : 'Import'}
                            </Button>
                            <Button type="button" onClick={() => setIsImportDialogOpen(false)} className="rounded bg-gray-600 py-2 px-4 text-sm text-white data-[hover]:bg-gray-500 data-[active]:bg-gray-700">
                                Cancel
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog open={showTagsModal} onClose={() => setShowTagsModal(false)} className="relative z-50">
                <div className="fixed inset-0 flex w-screen justify-center bg-white p-4">
                    <div className="flex items-center justify-center">
                        <DialogPanel className="w-full max-w-lg max-h-[90vh] overflow-auto space-y-4 border bg-white p-6 rounded shadow-xl">
                            <DialogTitle className="font-bold text-xl">Manage Tags for <span className="text-orange-500">{tagsModalSite}</span></DialogTitle>
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
                                        Delete tag <strong>{confirmDeleteTagName}</strong>? It will be removed from all assigned sites.
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

            <h1 className="text-xl font-bold text-left mb-4">Sites Configuration</h1>

            <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-2 justify-end">
                    <Button className="rounded bg-gray-500 py-2 px-4 text-sm text-white data-[hover]:bg-gray-400 data-[active]:bg-gray-600" onClick={() => { setSearchText(''); setEnabledFilter(''); setSortColumn(''); setSortOrder('asc'); setParserTypeFilter(''); setTagFilter(''); setSelectedTag(null); }}>
                        Reset Filters
                    </Button>
                    <Button className="rounded bg-blue-600 py-2 px-4 text-sm text-white data-[hover]:bg-blue-500 data-[active]:bg-blue-700" onClick={openImportDialog}>
                        Import Gamesheet
                    </Button>
                    <Button className="rounded bg-emerald-600 py-2 px-4 text-sm text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700" onClick={openCreateDialog}>
                        Add New Site
                    </Button>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <Field className="flex items-center space-x-2">
                        <Label className="text-sm font-medium whitespace-nowrap">Search</Label>
                        <Input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Search by name..."
                            className="rounded border border-gray-300 px-3 py-2 text-sm w-48"
                        />
                    </Field>
                    <Field className="flex items-center space-x-2">
                        <Label className="text-sm font-medium">Enabled</Label>
                        <Select
                            value={enabledFilter}
                            onChange={(e) => setEnabledFilter(e.target.value)}
                            className="rounded border border-gray-300 px-3 py-2 text-sm"
                        >
                            <option value="">All</option>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </Select>
                    </Field>
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
                    <div className="relative ml-4">
                        <input
                            type="text"
                            value={tagFilter}
                            onChange={e => {
                                setTagFilter(e.target.value)
                                if (selectedTag) setSelectedTag(null)
                            }}
                            onFocus={() => { if (tagSuggestions.length > 0) setShowTagSuggestions(true) }}
                            onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                            className="px-2 py-2 border border-gray-300 rounded-md text-sm w-48"
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
                </div>
            </div>

            <Field>
                <table className="table-auto bg-gray-100 w-full">
                    <thead className="sticky top-0">
                        <tr className="bg-slate-300">
                            <th className="px-2">ID</th>
                            <th className="px-2 cursor-pointer hover:bg-slate-400 select-none" onClick={() => handleSort('site_name')}>
                                Site Name{sortIndicator('site_name')}
                            </th>
                            <th className="px-2 cursor-pointer hover:bg-slate-400 select-none" onClick={() => handleSort('display_name')}>
                                Display Name{sortIndicator('display_name')}
                            </th>
                            <th className="px-2">Base URL</th>
                            <th className="px-2">Parser Type</th>
                            <th className="px-2">Enabled</th>
                            <th className="px-2 cursor-pointer hover:bg-slate-400 select-none" onClick={() => handleSort('last_scraped_at')}>
                                Last Scraped{sortIndicator('last_scraped_at')}
                            </th>
                            <th className="px-2 cursor-pointer hover:bg-slate-400 select-none" onClick={() => handleSort('games_scraped')}>
                                Games scraped{sortIndicator('games_scraped')}
                            </th>
                            <th className="px-2 cursor-pointer hover:bg-slate-400 select-none" onClick={() => handleSort('games_imported')}>
                                Games Upcoming{sortIndicator('games_imported')}
                            </th>
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
