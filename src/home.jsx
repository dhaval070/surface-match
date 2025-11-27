import { useState, useEffect } from 'react'
import './App.css'
import { Field, Label, Select, Button } from '@headlessui/react'
import { useAuth } from './AuthProvider.jsx'
import SurfaceDialog from './surface-dialog.jsx'

const apiurl = import.meta.env.VITE_API_URL

export default function Home() {
    const [siteLoc, setSiteLoc] = useState([])
    const [site, setSite] = useState("")
    const [allSites, setAllSites] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [currSiteLoc, setCurrSiteLoc] = useState(null)
    const [isBusy, setBusy] = useState(false)
    const auth = useAuth()
    const api = auth.api

    useEffect(function() {
        if (site == "") {
            setSiteLoc([])
            return
        }
        setBusy(true)
        api.get(apiurl + "/site-locations/"+ site.toString()).then((resp) => {
          setSiteLoc(resp.data)
        }).catch(e => console.error(e)).finally(() => setBusy(false))
    },[site, api]);

    useEffect(function() {
        setBusy(true)
        api.get(apiurl + "/sites").then((resp) => {
          setAllSites(resp.data)
        }).finally(() => setBusy(false))
    },[api])


    let assignSurface = function(rec) {
        setCurrSiteLoc(rec)
        setIsOpen(true)
    }

    let surfaceSelected = function(id, siteloc) {
      setIsOpen(false)
      setBusy(true)
      api.post(apiurl + "/set-surface", {
          site: site,
          location: siteloc.location,
          surface_id: id,
      }).then(resp => setSiteLoc(resp.data)).catch((e) => console.error(e)).finally(() => {
          setBusy(false)
      })
    }

      let rows = []

      if (siteLoc.length > 0) {
           rows = siteLoc.map(r => (
              <tr key={r.location} className="even:bg-gray-50 odd:bg-gray-200">
                <td className="text-left">{r.location}</td>
                <td className="text-left">{r.address}</td>
                <td className="text-left">{r.surface_id}</td>
                <td className="text-left">{r.LinkedSurface.name}</td>
                <td className="text-left">{r.surface}</td>
                <td className="text-left whitespace-nowrap w-48">
                  <Button className="rounded bg-sky-600 py-2 px-2 text-xs text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700" onClick={() => assignSurface(r)}>Change</Button>
                  &nbsp;&nbsp;
                  { r.surface_id != 0 &&
                  <Button className="rounded bg-emerald-600 py-2 px-2 text-xs text-white data-[hover]:bg-emerald-500 data-[active]:bg-emerald-700" onClick={() => surfaceSelected(0, r)}>Unset</Button>
  }
                </td>
              </tr>
          ))
      }

      let options = []
      if (allSites.length > 0) {
          options = allSites.map((r) => (
              <option key={r.site_name} value={r.site_name}>{r.display_name || r.site_name}</option>
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

      <SurfaceDialog province="Ontario" api={api} isOpen={isOpen} siteLoc={currSiteLoc} setIsOpen={setIsOpen} surfaceSelected={surfaceSelected} />

      <h1 className="text-xl font-bold text-left mb-4">Match Surfaces</h1>
      <Field >
        <div className="flex justify-start items-center">
              <Label className="text-sm/6 font-medium">Site</Label>&nbsp;&nbsp;
            <Select onChange={(e) => setSite(e.currentTarget.value)} className="rounded border-solid outline outline-gray-400 outline-2 w-64" >
              <option value="">Select</option>
              {options}
            </Select>
        </div>
      </Field >
      <Field className="my-5">
        <table className="bg-gray-100 w-full">
        <thead className="sticky top-0">
            <tr className="bg-slate-300">
                <th>Location</th><th>Address</th><th>Surface ID</th><th>Matched Surface name</th><th>Rink</th><th className="w-48">Actions</th>
            </tr>

        </thead>
        <tbody>
          {rows}
          </tbody>
        </table>
      </Field >
    </div>
    )
}
