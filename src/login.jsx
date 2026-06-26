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

    if (auth.loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="fas fa-circle-notch fa-spin fa-3x text-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <i className="fas fa-hockey-puck text-white text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 mt-1">Sign in to Surface Match</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <i className="fas fa-user text-gray-400" />
                            </div>
                            <Input
                                name="username"
                                type="text"
                                value={input.username}
                                onChange={handleInput}
                                placeholder="Enter your username"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <i className="fas fa-lock text-gray-400" />
                            </div>
                            <Input
                                name="password"
                                type="password"
                                value={input.password}
                                onChange={handleInput}
                                placeholder="Enter your password"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/25"
                    >
                        <i className="fas fa-arrow-right mr-2" />
                        Sign In
                    </Button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-8">
                    &copy; {new Date().getFullYear()} Surface Match
                </p>
            </div>
        </div>
    )
}
