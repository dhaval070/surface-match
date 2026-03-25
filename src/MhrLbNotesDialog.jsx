import { useState, useEffect } from 'react'
import { Button, Textarea } from '@headlessui/react'
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react'
import PropTypes from 'prop-types'

const apiurl = import.meta.env.VITE_API_URL

MhrLbNotesDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func,
    api: PropTypes.func,
    mhrId: PropTypes.number,
    rinkName: PropTypes.string,
    initialNotes: PropTypes.string,
    onSaveSuccess: PropTypes.func
}

export default function MhrLbNotesDialog(props) {
    const [notes, setNotes] = useState('')
    const [isBusy, setBusy] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(function() {
        if (!props.isOpen || !props.mhrId) return
        
        setNotes(props.initialNotes || '')
        setIsLoading(true)
        
        props.api.get(apiurl + `/mhr-lb-notes/${props.mhrId}`)
            .then(resp => {
                setNotes(resp.data.lb_notes || '')
            })
            .catch(err => {
                console.error(err)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [props.isOpen, props.mhrId, props.initialNotes, props.api])

    const handleSave = () => {
        if (!props.mhrId) return
        
        setBusy(true)
        props.api.post(apiurl + "/mhr-lb-notes", {
            mhr_id: props.mhrId,
            lb_notes: notes
        })
        .then(() => {
            if (props.onSaveSuccess) {
                props.onSaveSuccess()
            }
            props.setIsOpen(false)
        })
        .catch(err => {
            console.error(err)
        })
        .finally(() => {
            setBusy(false)
        })
    }

    if (!props.api) return <></>

    return (
        <>
            <Dialog open={props.isOpen} onClose={() => props.setIsOpen(false)} className="relative z-50">
                <div className="fixed inset-0 flex w-screen justify-center bg-white p-4">
                    <div className="flex items-center justify-center">
                        <DialogPanel className="max-w-2xl max-h-[80vh] h-auto overflow-auto space-y-2 border bg-white p-6">
                            <DialogTitle className="font-bold break-words">
                                LiveBarn Notes for {props.rinkName} (ID: {props.mhrId})
                            </DialogTitle>
                            <Description></Description>
                            
                            {isLoading ? (
                                <div className="flex justify-center items-center p-8">
                                    <div className="fas fa-circle-notch fa-spin fa-3x text-violet-600"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <Textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full rounded border border-gray-300 px-3 py-2"
                                            rows={12}
                                            placeholder="Enter LiveBarn notes here..."
                                        />
                                    </div>
                                    
                                    <div className="flex gap-4 justify-end">
                                        <Button 
                                            className="rounded bg-gray-300 py-2 px-4 text-sm text-gray-800 data-[hover]:bg-gray-400 data-[active]:bg-gray-500"
                                            onClick={() => props.setIsOpen(false)}
                                            disabled={isBusy}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            className="rounded bg-sky-600 py-2 px-4 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700"
                                            onClick={handleSave}
                                            disabled={isBusy}
                                        >
                                            {isBusy ? (
                                                <>
                                                    <span className="fas fa-circle-notch fa-spin mr-2"></span>
                                                    Saving...
                                                </>
                                            ) : 'Save'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}