import Home from './home.jsx'
import Login from './login.jsx'
import Mapping from './Mapping.jsx'
import RAMPMapping from './RAMP-mappings.jsx'
import Layout from './Layout.jsx'
import AuthProvider from './AuthProvider.jsx'
import PrivateRoute from './PrivateRoute.jsx'
import SitesConfig from './SitesConfig.jsx'
import Locations from './Locations.jsx'
import Events from './Events.jsx'
import SurfaceReport from './SurfaceReport.jsx'
import RinkReport from './RinkReport.jsx'
import Users from './Users.jsx'

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

export default function App() {
    return <Router>
        <AuthProvider>
            <Routes>
                <Route element={<Layout />} >
                    <Route path="/login" element={<Login />} />
                    <Route element={<PrivateRoute />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/mappings" element={<Mapping />} />
                        <Route path="/ramp-mappings" element={<RAMPMapping />} />
                        <Route path="/sites-config" element={<SitesConfig />} />
                        <Route path="/locations" element={<Locations />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/surface-report" element={<SurfaceReport />} />
                        <Route path="/rink-report" element={<RinkReport />} />
                        <Route path="/users" element={<Users />} />
                    </Route>
                </Route>
            </Routes>
        </AuthProvider>
    </Router>
}

