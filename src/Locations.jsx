import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './AuthProvider.jsx'
import LocationSurfacesDialog from './LocationSurfacesDialog.jsx'

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

export default function Locations() {
    const [locations, setLocations] = useState([])
    const [isBusy, setBusy] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState(null)
    const [pageSize, setPageSize] = useState(10)
    const [nameFilter, setNameFilter] = useState('');
    const [postalCodeFilter, setPostalCodeFilter] = useState('');

    const [showSurfacesDialog, setShowSurfacesDialog] = useState(false);
    const [selectedLocationForSurfaces, setSelectedLocationForSurfaces] = useState(null);

    const debouncedNameFilter = useDebounce(nameFilter, 500);
    const debouncedPostalCodeFilter = useDebounce(postalCodeFilter, 500);

    const auth = useAuth()
    const api = auth.api

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedNameFilter, debouncedPostalCodeFilter, pageSize]);

    useEffect(function() {
        setBusy(true)
        const params = new URLSearchParams({
            page: currentPage,
            perPage: pageSize,
        });
        if (debouncedNameFilter) {
            params.append('name', debouncedNameFilter);
        }
        if (debouncedPostalCodeFilter) {
            params.append('postal_code', debouncedPostalCodeFilter);
        }

        api.get(`${apiurl}/locations?${params.toString()}`).then((resp) => {
          setLocations(resp.data.data)
          setPagination(resp.data)
        }).catch(e => {
          console.error("API Error:", e)
        }).finally(() => setBusy(false))
    },[api, currentPage, pageSize, debouncedNameFilter, debouncedPostalCodeFilter]);

    let rows = []

    if (locations.length > 0) {
         console.log("First location object keys:", Object.keys(locations[0]))
         rows = locations.map((r, index) => (
            <tr key={r.id || index} className="even:bg-gray-50 odd:bg-gray-200">
              <td className="text-left px-4 py-2">{r.id}</td>
              <td className="text-left px-4 py-2">{r.name}</td>
              <td className="text-left px-4 py-2">{r.address1}</td>
              <td className="text-left px-4 py-2">{r.postal_code}</td>
              <td className="text-left px-4 py-2">{r.city}</td>
              <td className="text-left px-4 py-2">
                <button
                  onClick={() => {
                    setSelectedLocationForSurfaces(r);
                    setShowSurfacesDialog(true);
                  }}
                  className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  View Surfaces
                </button>
              </td>
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
        setNameFilter('');
        setPostalCodeFilter('');
        setCurrentPage(1);
    };

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1;

    return (
      <div className="App w-full">

      {isBusy &&
      <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
        <div className="flex justify-center items-center mt-[50vh]">
          <div className="fas fa-circle-notch fa-spin fa-5x text-violet-600"></div>
        </div>
      </div>
      }

      <h1 className="text-xl font-bold text-left mb-4">LIve Barn Locations</h1>
      
      <div className="flex justify-between items-center my-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-4 items-center">
              <input
                  type="text"
                  value={nameFilter}
                  onChange={e => setNameFilter(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-md"
                  placeholder="Filter by name..."
              />
              <input
                  type="text"
                  value={postalCodeFilter}
                  onChange={e => setPostalCodeFilter(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-md"
                  placeholder="Filter by postal code..."
              />
              <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                  disabled={isBusy || (nameFilter === '' && postalCodeFilter === '')}
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
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Address1</th>
                <th className="px-4 py-2">Postal Code</th>
                <th className="px-4 py-2">City</th>
                <th className="px-4 py-2">Surfaces</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>

      {selectedLocationForSurfaces && (
          <LocationSurfacesDialog
              isOpen={showSurfacesDialog}
              setIsOpen={setShowSurfacesDialog}
              locationName={selectedLocationForSurfaces.name}
              surfaces={selectedLocationForSurfaces.surfaces}
          />
      )}

      {pagination && totalPages > 1 && (
        <div className="flex justify-between items-center my-4">
          <div className="flex gap-2"> {/* Group First and Previous */}
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
          <div className="flex gap-2"> {/* Group Next and Last */}
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

      {locations.length === 0 && !isBusy &&
        <p className="text-gray-600 text-center mt-4">No locations found</p>
      }
    </div>
    )
}
