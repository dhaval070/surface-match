import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import PropTypes from 'prop-types';
import { Field, Label, Select, Button } from '@headlessui/react'

const apiurl = import.meta.env.VITE_API_URL

function App() {
  const [siteLoc, setSiteLoc] = useState([])
  const [site, setSite] = useState("")
  const [allSites, setAllSites] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [currSiteLoc, setCurrSiteLoc] = useState(null)
  const [isBusy, setBusy] = useState(false)

  SurfaceDialog.propTypes = {
      isOpen: PropTypes.bool.isRequired,
      setIsOpen: PropTypes.func,
      surfaceSelected: PropTypes.func,
      siteLoc: PropTypes.object,
  }

  useEffect(function() {
      if (site == "") {
          setSiteLoc([])
          return
      }
      setBusy(true)
      axios.get(apiurl + "/site-locations/"+ site.toString()).then((resp) => {
        setSiteLoc(resp.data)
      }).catch(e => console.error(e)).finally(() => setBusy(false))
  },[site]);

  useEffect(function() {
      setBusy(true)
    axios.get(apiurl + "/sites").then((resp) => {
        setAllSites(resp.data)
    }).catch(e => console.error(e)).finally(() => setBusy(false))
  },[])


  let assignSurface = function(rec) {
      setCurrSiteLoc(rec)
      setIsOpen(true)
  }

  let surfaceSelected = function(id, siteloc) {
    setBusy(true)
    axios.post(apiurl + "/set-surface", {
        site: site,
        location: siteloc.location,
        surface_id: id,
    }).then(resp => setSiteLoc(resp.data)).catch((e) => console.error(e)).finally(() => {
        setBusy(false)
        setIsOpen(false)
    })
  }

    let rows = []

    if (siteLoc.length > 0) {
         rows = siteLoc.map(r => (
            <tr key={r.location} className="even:bg-gray-50 odd:bg-gray-200">
              <td>{r.location}</td>
              <td>{r.address}</td>
              <td>{r.surface_id}</td>
              <td>{r.LinkedSurface.name}</td>
              <td>
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
            <option key={r.site}>{r.site}</option>
        ))
    }

  return (
    <div className="App w-fit">

    {isBusy &&
    <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
      <div className="flex justify-center items-center mt-[50vh]">
        <div className="fas fa-circle-notch fa-spin fa-5x text-violet-600"></div>
      </div>
    </div>
    }

    <SurfaceDialog isOpen={isOpen} siteLoc={currSiteLoc} setIsOpen={setIsOpen} surfaceSelected={surfaceSelected} />

    <h1 className="text-3xl font-bold text-center">Match Surfaces</h1>
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
      <table className="table-auto bg-gray-100">
      <tbody>
        <tr className="bg-slate-300">
            <th>Location</th><th>Address</th><th>Surface ID</th><th>Surface name</th><th></th>
        </tr>
        {rows}
        </tbody>
      </table>
    </Field >
  </div>
  )
}

function SurfaceDialog(props) {
    const [surfaces, setSurfaces] = useState([])

    useEffect(function() {
        axios.get(apiurl + "/surfaces").then((res) => {
            setSurfaces(res.data)
        }).catch(e => console.error(e))
    },[])

    let res = []
    if (surfaces.length > 0) {
        res = surfaces.map(r => (
            <tr key={r.id}>
                <td><a href="#" className="font-bold text-blue-600 hover:text-blue-400" onClick={() => props.surfaceSelected(r.id, props.siteLoc)} >{r.id}</a></td>
                <td>{r.name}</td>
                <td>{r.Location.name}</td>
                <td>{r.Location.address1}</td>
                <td>{r.Location.city}</td>
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

                        <table className="table-auto w-full ">
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
export default App
