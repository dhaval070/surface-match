import Home from './home.jsx'
import Login from './login.jsx'
import Mapping from './Mapping.jsx'
import Layout from './Layout.jsx'
import AuthProvider from './AuthProvider.jsx'
import PrivateRoute from './PrivateRoute.jsx'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

export default function App() {
    return <Router>
        <AuthProvider>
          <Routes>
            <Route  element={<Layout />} >
                <Route path="/login" element={<Login />} />
                <Route element={<PrivateRoute />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/mappings" element={<Mapping />} />
                </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
}

