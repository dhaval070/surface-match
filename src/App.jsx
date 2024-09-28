import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// axios.defaults.headers["Origin"] = "localhost"
function App() {
  const [siteLoc, setSiteLoc] = useState([])
  const [site, setSite] = useState("")
  const [allSites, setAllSites] = useState([])

  useEffect(function() {
      if (site == "") {
          return
      }
      console.log("site", site)
      axios.get("http://localhost:8000/site-locations/"+ site.toString()).then((resp) => {
        setSiteLoc(resp.data)
      }).catch(e => console.error(e))
  },[site]);

  useEffect(function() {
    axios.get("http://localhost:8000/sites").then((resp) => {
        setAllSites(resp.data)
    }).catch(e => console.error(e))
  },[])

    let rows = []

    if (siteLoc.length > 0) {
         rows = siteLoc.map(r => (
            <tr key={r.location}>
              <td>{r.location}</td>
              <td>{r.address}</td>
              <td>
                  {r.surface_id}
              </td>
              <td><a href="#" >Set</a></td>
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
    <>
      <h1>Match Surfaces</h1>
      <div className="card">
      Site
          <select onChange={(e) => setSite(e.currentTarget.value)}>
            <option value="">Select</option>
            {options}
          </select>
      <table width="100%">
      <tbody>
        <tr>
            <th>Location</th><th>Address</th><th>Surface</th><th></th>
        </tr>
        {rows}
        </tbody>
      </table>
      </div>
    </>
  )
}

export default App
