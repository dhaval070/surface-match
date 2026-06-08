
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
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
                            <button className={navLinkClass("/surface-report")} onClick={() => navigate("/surface-report")}>
                                Surface Report
                            </button>
                            <button className={navLinkClass("/rink-report")} onClick={() => navigate("/rink-report")}>
                                Rink Report
                            </button>
                            <button className={navLinkClass("/mappings")} onClick={() => navigate("/mappings")}>
                                Mappings
                            </button>
                            <button className={navLinkClass("/MHR Locations")} onClick={() => navigate("/mhr-locations")}>
                                MHR Locations
                            </button>
                            <button className={navLinkClass("/ramp-mappings")} onClick={() => navigate("/ramp-mappings")}>
                                RAMP Mappings
                            </button>
                            <button className={navLinkClass("/sites-config")} onClick={() => navigate("/sites-config")}>
                                Sites Config
                            </button>
                            <button className={navLinkClass("/locations")} onClick={() => navigate("/locations")}>
                                Live Barn Locations
                            </button>
                            <button className={navLinkClass("/events")} onClick={() => navigate("/events")}>
                                Events
                            </button>
                            <button className={navLinkClass("/users")} onClick={() => navigate("/users")}>
                                Users
                            </button>
                            <button className={navLinkClass("/kmaster-venues")} onClick={() => navigate("/kmaster-venues")}>
                                KMaster Venues
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Menu as="div" className="relative inline-block text-left">
                                <MenuButton className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors border border-gray-300">
                                    <span>Hi, <span className="font-semibold text-gray-800">{auth.user}</span></span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                    </svg>
                                </MenuButton>
                                <MenuItems className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg focus:outline-none z-10">
                                    <MenuItem as="button" onClick={() => navigate('/change-password')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Change Password
                                    </MenuItem>
                                    <MenuItem as="button" onClick={logout} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Logout
                                    </MenuItem>
                                </MenuItems>
                            </Menu>
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
