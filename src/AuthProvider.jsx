import { useState, useEffect, useContext, createContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import PropTypes from 'prop-types';

const apiurl = import.meta.env.VITE_API_URL
axios.defaults.withCredentials = true

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true)
    // const [token, setToken] = useState(localStorage.getItem("site") || "");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchdata = async function() {
            const resp = await axios.get(apiurl + "/session")
            if (resp.data.username) {
                setUser(resp.data.username)
            }
        }
        try {
            fetchdata()
        }
        catch(e) {
            alert(e)
        }
        finally{
            setLoading(false)
        }
    }, [])

    const loginAction = async (data) => {
        try {
          const resp = await axios.post(apiurl + "/login", data);
          if (resp.data.error) {
              alert(resp.data.error)
              return
          }
          setUser(resp.data.username);
          // setToken(res.token);
          // localStorage.setItem("site", res.token);
          navigate("/");
        } catch (err) {
          console.error(err);
        }
    };

    const logOut = () => {
        setUser(null);
        // setToken("");
        // localStorage.removeItem("site");
        navigate("/login");
    };

    return <AuthContext.Provider value={{loading, user, loginAction, logOut}}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
    children: PropTypes.element
}

export default AuthProvider;

export const useAuth = () => {
  return useContext(AuthContext);
};
