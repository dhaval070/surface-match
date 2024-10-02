
import { Button } from "@headlessui/react";
import { Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function Layout() {
    const auth = useAuth()

    const logout = () => {
        auth.logOut()
    }

    return <div>
    <div className="text-right">
    {auth.user &&
        <>
        Hi, {auth.user} &nbsp;
        <Button onClick={logout} className="rounded bg-amber-600 py-2 px-4 text-sm text-white data-[hover]:bg-amber-500 data-[active]:bg-sky-700">Logout</Button>
        </>}
    </div>
    <Outlet />;
    </div>

}
