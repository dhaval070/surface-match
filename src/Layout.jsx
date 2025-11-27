
import { Button } from "@headlessui/react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useNavigate } from "react-router-dom";

export default function Layout() {
    const auth = useAuth()
    const navigate = useNavigate();
    const location = useLocation();

    const logout = () => {
        auth.logOut()
    }

    const apiurl = import.meta.env.VITE_API_URL
    const report = () => {
        window.open(apiurl + "/report")
    }

    const isActive = (path) => {
        return location.pathname === path;
    }

    const navLinkClass = (path) => {
        return isActive(path)
            ? "px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md transition-colors"
            : "px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors";
    }

    return <div className="min-h-screen bg-gray-50">
    {auth.user &&
        <nav className="bg-white shadow-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-1">
                        <button className={navLinkClass("/")} onClick={() => navigate("/")}>
                            Home
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" onClick={report}>
                            Surface Report
                        </button>
                        <button className={navLinkClass("/mappings")} onClick={() => navigate("/mappings")}>
                            Mappings
                        </button>
                        <button className={navLinkClass("/ramp-mappings")} onClick={() => navigate("/ramp-mappings")}>
                            RAMP Mappings
                        </button>
                        <button className={navLinkClass("/sites-config")} onClick={() => navigate("/sites-config")}>
                            Sites Config
                        </button>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Hi, <span className="font-semibold text-gray-800">{auth.user}</span></span>
                        <Button onClick={logout} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors border border-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    }
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
    </main>
    </div>

}
