import { useState, useEffect } from 'react'
import './App.css'
import { Field, Label, Select } from '@headlessui/react'
import { useAuth } from './AuthProvider.jsx'

const apiurl = import.meta.env.VITE_API_URL

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function Events() {
    const [events, setEvents] = useState([])
    const [isBusy, setBusy] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState(null)
    const [pageSize, setPageSize] = useState(10)
    const [site, setSite] = useState("")
    const [allSites, setAllSites] = useState([])
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const debouncedSite = useDebounce(site, 500);
    const debouncedStartDate = useDebounce(startDate, 500);
    const debouncedEndDate = useDebounce(endDate, 500);

    const auth = useAuth()
    const api = auth.api

    useEffect(function() {
        setBusy(true)
        api.get(apiurl + "/sites").then((resp) => {
          setAllSites(resp.data)
        }).finally(() => setBusy(false))
    },[api])

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSite, debouncedStartDate, debouncedEndDate, pageSize]);

    useEffect(function() {
        setBusy(true)
        const params = new URLSearchParams({
            page: currentPage,
            perPage: pageSize,
        });
        if (debouncedSite) {
            params.append('site', debouncedSite);
        }
        if (debouncedStartDate) {
            params.append('start_date', debouncedStartDate);
        }
        if (debouncedEndDate) {
            params.append('end_date', debouncedEndDate);
        }

        api.get(`${apiurl}/events?${params.toString()}`).then((resp) => {
          setEvents(resp.data.data)
          setPagination(resp.data)
        }).catch(e => {
          console.error("API Error:", e)
        }).finally(() => setBusy(false))
    },[api, currentPage, pageSize, debouncedSite, debouncedStartDate, debouncedEndDate]);

    let rows = []

    if (events.length > 0) {
         console.log("First event object keys:", Object.keys(events[0]))
         rows = events.map((r, index) => (
            <tr key={r.id || index} className="even:bg-gray-50 odd:bg-gray-200">
              <td className="text-left px-4 py-2">{r.id}</td>
              <td className="text-left px-4 py-2">{r.site}</td>
              <td className="text-left px-4 py-2">{r.datetime}</td>
              <td className="text-left px-4 py-2">{r.home_team}</td>
              <td className="text-left px-4 py-2">{r.guest_team}</td>
              <td className="text-left px-4 py-2">{r.location}</td>
              <td className="text-left px-4 py-2">{r.division}</td>
              <td className="text-left px-4 py-2">{r.surface_id}</td>
            </tr>
        ))
    }

    const handlePrevPage = () => {
        setCurrentPage(page => page - 1);
    };

    const handleNextPage = () => {
        setCurrentPage(page => page + 1);
    };

    const handleFirstPage = () => {
        setCurrentPage(1);
    };

    const handleLastPage = () => {
        setCurrentPage(totalPages);
    };

    const handleClearFilters = () => {
        setSite('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1;

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

      <h1 className="text-xl font-bold text-left mb-4">Events</h1>
      
      <div className="flex justify-between items-center my-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-4 items-center flex-wrap">
              <Field>
                  <div className="flex justify-start items-center gap-2">
                      <Label className="text-sm/6 font-medium">Site</Label>
                      <Select 
                          onChange={(e) => setSite(e.currentTarget.value)} 
                          value={site}
                          className="rounded border-solid outline outline-gray-400 outline-2 w-64"
                          disabled={isBusy}
                      >
                          <option value="">All Sites</option>
                          {options}
                      </Select>
                      {site && <span className="ml-4 text-sm font-medium">Selected: {site}</span>}
                  </div>
              </Field>
              <Field>
                  <div className="flex justify-start items-center gap-2">
                      <Label className="text-sm/6 font-medium">Date Range</Label>
                      <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md"
                          disabled={isBusy}
                          placeholder="Start Date"
                      />
                      <span className="text-sm font-medium">to</span>
                      <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md"
                          disabled={isBusy}
                          placeholder="End Date"
                      />
                  </div>
              </Field>
              <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                  disabled={isBusy || (site === '' && startDate === '' && endDate === '')}
              >
                  Clear Filters
              </button>
          </div>
          <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm font-medium">Per Page:</label>
              <select
                  id="pageSize"
                  value={pageSize}
                  onChange={e => {
                      setPageSize(Number(e.target.value));
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md bg-white"
                  disabled={isBusy}
              >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
              </select>
          </div>
      </div>

      <div className="my-5">
        <table className="table-auto bg-gray-100 w-full">
          <thead className="sticky top-0">
            <tr className="bg-slate-300">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Site</th>
                <th className="px-4 py-2">Date/Time</th>
                <th className="px-4 py-2">Home Team</th>
                <th className="px-4 py-2">Guest Team</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Division</th>
                <th className="px-4 py-2">Surface ID</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex justify-between items-center my-4">
          <div className="flex gap-2">
            <button
              onClick={handleFirstPage}
              disabled={currentPage === 1 || isBusy}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isBusy}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
          </div>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || isBusy}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={handleLastPage}
              disabled={currentPage >= totalPages || isBusy}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {events.length === 0 && !isBusy &&
        <p className="text-gray-600 text-center mt-4">No events found</p>
      }
    </div>
    )
}
