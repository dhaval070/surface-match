import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'

const apiurl = import.meta.env.VITE_API_URL

export default function ChangePassword() {
    const auth = useAuth()
    const api = auth.api
    const navigate = useNavigate()
    const [currentPassword, setCurrentPassword] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [isBusy, setBusy] = useState(false)
    const [message, setMessage] = useState(null)
    const [messageType, setMessageType] = useState('success')
    const [cooldownSeconds, setCooldownSeconds] = useState(0)
    const [persistMessage, setPersistMessage] = useState(false)
    const redirectRef = useRef(false)

    const showMessage = (msg, type = 'success', persist = false) => {
        setMessage(msg)
        setMessageType(type)
        setPersistMessage(persist)
    }

    useEffect(() => {
        if (cooldownSeconds <= 0) return
        const id = setInterval(() => {
            setCooldownSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(id)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(id)
    }, [cooldownSeconds])

    useEffect(() => {
        if (cooldownSeconds === 0 && persistMessage) {
            setMessage(null)
            setPersistMessage(false)
        }
    }, [cooldownSeconds, persistMessage])

    const handleSubmit = async () => {
        setMessage(null)
        if (!currentPassword || !password || !confirm) {
            showMessage('All fields are required', 'error')
            return
        }
        if (password !== confirm) {
            showMessage('New password and confirm do not match', 'error')
            return
        }
        setBusy(true)
        try {
            await api.put(`${apiurl}/users/${auth.user}/password`, {
                current_password: currentPassword,
                password,
                confirm
            })
            showMessage('Password changed. Please log in again.', 'success')
            // server invalidates sessions; force logout and navigate to login after short delay
            redirectRef.current = true
            setTimeout(() => {
                auth.logOut()
                navigate('/login')
            }, 3000)
            return
        }
        catch (e) {
            console.error('API Error:', e)
            const status = e.response?.status
            const err = e.response?.data
            const errMsg = err?.error || 'Failed to change password'
            // handle rate limit cooldown
            if (status === 429) {
                // support both 'countdown_seconds' and 'cooldown_seconds' keys
                const secs = Number(err?.cooldown_seconds ?? 0) || 0
                if (secs > 0) {
                    setCooldownSeconds(secs)
                    showMessage(`${errMsg} - retry in ${secs} seconds`, 'error', true)
                } else {
                    showMessage(errMsg, 'error')
                }
            } else {
                showMessage(errMsg, 'error')
            }
        }
        finally {
            if (!redirectRef.current) setBusy(false)
        }
    }

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-4">Change Password</h1>
            {message && (
                <div className={`mb-4 px-4 py-2 rounded ${messageType === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {message}
                    {cooldownSeconds > 0 && <div className="mt-1 text-sm">Retry available in {cooldownSeconds} second{cooldownSeconds !== 1 ? 's' : ''}</div>}
                </div>
            )}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isBusy || cooldownSeconds > 0} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isBusy || cooldownSeconds > 0} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isBusy || cooldownSeconds > 0} />
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSubmit} disabled={isBusy || cooldownSeconds > 0} className="rounded bg-blue-600 py-2 px-4 text-sm text-white hover:bg-blue-500 disabled:opacity-50">
                        Change Password
                    </button>
                </div>
            </div>
        </div>
    )
}
