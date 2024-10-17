import { useState, useEffect } from 'react'
import {  Button } from '@headlessui/react'
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import PropTypes from 'prop-types';

SurfaceDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func,
    surfaceSelected: PropTypes.func,
    siteLoc: PropTypes.object,
    api: PropTypes.func,
}

const apiurl = import.meta.env.VITE_API_URL

export default function SurfaceDialog(props) {
    const [surfaces, setSurfaces] = useState([])

    useEffect(function() {
        if (!props.api) return
        props.api.get(apiurl + "/surfaces").then((res) => {
            setSurfaces(res.data)
        }).catch(e => console.error(e))
    },[props.api])

    if (!props.api) {
        return <></>
    }
    let res = []
    if (surfaces.length > 0) {
        res = surfaces.map(r => (
            <tr key={r.id}>
                <td className="border"><a href="#" className="font-bold text-blue-600 hover:text-blue-400" onClick={() => props.surfaceSelected(r.id, props.siteLoc)} >{r.id}</a></td>
                <td className="border">{r.name}</td>
                <td className="border">{r.Location.name}</td>
                <td className="border">{r.Location.address1}</td>
                <td className="border">{r.Location.city}</td>
            </tr>
        ))
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
