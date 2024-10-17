import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './AuthProvider.jsx'
import SurfaceDialog from './surface-dialog.jsx'
import { Field, Label, Select, Button } from '@headlessui/react'

const apiurl = import.meta.env.VITE_API_URL

export default function Mapping() {
    const [siteLoc, setSiteLoc] = useState([])
    const [currSiteLoc, setCurrSiteLoc] = useState(null)
    const [isBusy, setBusy] = useState(false)
    const [site, setSite] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const auth = useAuth()
    const api = auth.api
    const options = ["gthl", "mhl", "nyhl"].map((l) => <option key={l}>{l}</option>)

    let assignSurface = function(rec) {
        setCurrSiteLoc(rec)
        setIsOpen(true)
    }

    let surfaceSelected = function(id, siteloc) {
      setIsOpen(false)
      setBusy(true)
      api.post(apiurl + "/set-mapping", {
          site: site,
          location: siteloc.location,
          surface_id: id,
      }).then(resp => setSiteLoc(resp.data)).catch((e) => console.error(e)).finally(() => {
          setBusy(false)
      })
    }

    useEffect(function() {
        if (site == "") {
            setSiteLoc([])
            return
        }
        setBusy(true)
        api.get(apiurl + "/mappings/"+ site.toString()).then((resp) => {
          setSiteLoc(resp.data)
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    },[site, api]);

    let rows = []

    if (siteLoc.length > 0) {
         rows = siteLoc.map(r => (
            <tr key={r.location} className="even:bg-gray-50 odd:bg-gray-200">
              <td className="text-left">{r.location}</td>
              <td className="text-left">{r.surface_id}</td>
              <td className="text-left">{r.surface_name}</td>
              <td className="text-left">
                <Button className="rounded bg-sky-600 py-2 px-2 text-xs text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700" onClick={() => assignSurface(r)}>Change</Button>
                &nbsp;&nbsp;
                { r.surface_id != 0 &&
                <Button className="rounded bg-emerald-600 py-2 px-2 text-xs text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700" onClick={() => surfaceSelected(0, r)}>Unset</Button>
}
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

      <SurfaceDialog api={api} isOpen={isOpen} siteLoc={currSiteLoc} setIsOpen={setIsOpen} surfaceSelected={surfaceSelected} />

    <h1 className="text-3xl font-bold text-center">Static Mappings</h1>
    <Field >
      <div className="flex justify-start ">
            <Label  className="text-sm/6 font-medium ">Site</Label>&nbsp;&nbsp;
          <Select onChange={(e) => setSite(e.currentTarget.value)} className="rounded border-solid outline outline-gray-400 outline-2" >
            <option value="">Select</option>
            {options}
          </Select>
      </div>
        </Field >
        <Field className="my-5">
          <table className="table-auto bg-gray-100 w-full">
          <tbody>
            <tr className="bg-slate-300">
                <th>Location</th><th>Surface ID</th><th>Surface name</th><th></th>
            </tr>
            {rows}
            </tbody>
          </table>
        </Field >
      </div>
    )

}
