import { useState, useEffect } from 'react'
import {  Button, Field, Label, Select } from '@headlessui/react'
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import PropTypes from 'prop-types';

SurfaceDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func,
    surfaceSelected: PropTypes.func,
    siteLoc: PropTypes.object,
    api: PropTypes.func,
    province: PropTypes.string,
}

const apiurl = import.meta.env.VITE_API_URL

export default function SurfaceDialog(props) {
    const [surfaces, setSurfaces] = useState([])
    const [isBusy, setBusy] = useState(false)
    const [provinces, setProvinces] = useState([])
    const [selectedProvince, setSelectedProvince] = useState("")

    let defaultProvince = ""

    if (props.province) {
        defaultProvince = props.province
    } else if (props.siteLoc) {
        defaultProvince = props.siteLoc.province_name
    }

    useEffect(function() {
        if (!props.api) return
        props.api.get(apiurl + "/provinces")
            .then((res) => {
                setProvinces(res.data)
                if (defaultProvince) {
                    setSelectedProvince(defaultProvince)
                }
            })
            .catch(e => console.error(e))
    }, [props.api, defaultProvince])

    useEffect(function() {
        if (!props.api || !selectedProvince) return
        setBusy(true)
        props.api.get(apiurl + "/surfaces", {
            params: { province: selectedProvince },
        }).then((res) => {
            setSurfaces(res.data)
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    },[selectedProvince, props.api])

    if (!props.api || !props.siteLoc) {
        return <></>
    }

    let res = []
    if (surfaces.length > 0) {
        res = surfaces.map(r => (
            <tr key={r.id}>
                <td className="border"><a href="#" className="font-bold text-blue-600 hover:text-blue-400" onClick={() => props.surfaceSelected(r.id, props.siteLoc)} >{r.id}</a></td>
                <td className="border">{r.name}</td>
                <td className="border">{r.location_name}</td>
                <td className="border">{r.location_address1}</td>
                <td className="border">{r.location_city}</td>
            </tr>
        ))
    }

    if (isBusy) {
        return <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
          <div className="flex justify-center items-center mt-[50vh]">
            <div className="fas fa-circle-notch fa-spin fa-5x text-violet-600"></div>
          </div>
        </div>
    }
    return (
        <>
            <Dialog open={props.isOpen} onClose={() => props.setIsOpen(false)} className="relative z-50">
                <div className="fixed inset-0 flex w-screen justify-center bg-white  p-4">
                  <div className="flex items-center justify-center ">
                      <DialogPanel className=" w-max  h-full overflow-auto  space-y-2 border bg-white p-2">
                        <DialogTitle className="font-bold">
                            Select surface for <span className="text-orange-500">{props.siteLoc && props.siteLoc.location}</span>
                        </DialogTitle>
                        <Description></Description>
                        
                        <div className="flex gap-2">
                          <Button className="rounded bg-red-600 py-2 px-4 text-sm text-white data-[hover]:bg-red-500 data-[active]:bg-red-700" onClick={() => props.surfaceSelected(-1, props.siteLoc)}>Dnf</Button>
                        </div>

                        <Field>
                            <Label className="text-sm/6 font-medium">Province</Label>
                            <Select 
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm/6"
                                value={selectedProvince}
                                onChange={(e) => setSelectedProvince(e.target.value)}
                            >
                                <option value="">Select a province</option>
                                {provinces.map(p => (
                                    <option key={p.id} value={p.province_name}>{p.province_name}</option>
                                ))}
                            </Select>
                        </Field>

                        <table className="table-auto w-full border">
                            <thead className="sticky top-0">
                                <tr className="bg-gray-100">
                                    <th>ID</th><th>Name</th><th>Location</th><th>Address1</th><th>City</th>
                                </tr>
                            </thead>
                            <tbody className="overflow-y-auto">
                                {res}
                            </tbody>
                        </table>
                        <p>
                        </p>
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
