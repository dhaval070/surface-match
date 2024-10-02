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
    const navigate = useNavigate();

    const api = axios.create()
    api.defaults.withCredentials = true

    api.interceptors.response.use(undefined, (err) => {
        console.error("caught", err)
        if (err.status == 401) {
            setUser(null)
            // navigate("/login")
        }
        throw err
    })

    useEffect(() => {
        setLoading(true)
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
          setLoading(true)
          const resp = await axios.post(apiurl + "/login", data);
          if (resp.data.error) {
              alert(resp.data.error)
              return
          }
          setUser(resp.data.username);
          navigate("/");
        } catch (err) {
          console.error(err);
        } finally {
            setLoading(false)
        }
    };

    const logOut = () => {
        setLoading(true)
        axios.get(apiurl + "/logout").then(() => {
            setUser(null);
            navigate("/login");
        }).catch((e) => alert(e)).finally(() => setLoading(false))
    };

    return <AuthContext.Provider value={{api, loading, user, loginAction, logOut}}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
    children: PropTypes.element
}

export default AuthProvider;

export const useAuth = () => {
  return useContext(AuthContext);
};
