import { useEffect, useState } from 'react'
import { Input, Button } from '@headlessui/react'
import { useAuth } from './AuthProvider.jsx'
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [input, setInput] = useState({
        username: "",
        password: "",
    })

    const navigate = useNavigate();
    const auth = useAuth()

    const handleSubmit = (e) => {
        e.preventDefault()
        if (input.username.trim() === "" || input.password.trim() === "") {
            alert("Username and password are required")
            return
        }
        auth.loginAction(input)
    }

    useEffect(() => {
        if (auth.user != null) {
            navigate("/")
        }

    }, [auth.user, navigate])

    useEffect(() => {
        const el = document.querySelector('input[name="username"]')
        if (el) el.focus()
    }, [])

    const handleInput = (e) => {
        const { name, value } = e.target
        setInput((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    console.info("auth loading", auth.loading)
    if (auth.loading) {
        return <div>Loading</div>
    }

    return (
        <div className="w-full border border-black border-solid p-5">
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <table className="border-none">
                    <tbody>
                        <tr>
                            <td>Username</td>
                            <td><Input name="username" type="text" value={input.username} onChange={handleInput} /></td>
                        </tr>
                        <tr>
                            <td>Password</td>
                            <td><Input name="password" type="password" value={input.password} onChange={handleInput} /></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td>
                                <Button type="submit" className="rounded bg-sky-600 py-2 px-2  text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700">Login</Button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </form>
        </div>
    )
}
