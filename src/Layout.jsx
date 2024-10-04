
import { Button } from "@headlessui/react";
import { Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function Layout() {
    const auth = useAuth()

    const logout = () => {
        auth.logOut()
    }

    const apiurl = import.meta.env.VITE_API_URL
    const report = () => {
        window.open(apiurl + "/report")

    }
    return <div>
    {auth.user &&
        <>
    <div className="flex" >
        <div className="text-left grow">
            <button className="rounded text-left bg-slate-400 py-2 px-4 text-sm  data-[hover]:bg-slate-500 data-[active]:bg-sky-700" onClick={report}>Surface Report</button>
        </div>
        <div className="justify-right">
            Hi, {auth.user} &nbsp;
            <Button onClick={logout} className="rounded bg-amber-600 py-2 px-4 text-sm text-white data-[hover]:bg-amber-500 data-[active]:bg-sky-700">Logout</Button>
        </div>
    </div>
        </>
    }
    <Outlet />
    </div>

}
