import { useState, useEffect } from 'react'
import './App.css'
import { Button } from '@headlessui/react'
import { useAuth } from './AuthProvider.jsx'

const apiurl = import.meta.env.VITE_API_URL

export default function Users() {
    const [users, setUsers] = useState([])
    const [isBusy, setBusy] = useState(false)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedUsername, setSelectedUsername] = useState(null)
    const [newUsername, setNewUsername] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [apiMessage, setApiMessage] = useState(null)
    const [messageType, setMessageType] = useState('success')
    const auth = useAuth()
    const api = auth.api

    const fetchUsers = () => {
        setBusy(true)
        api.get(apiurl + "/users").then((resp) => {
          setUsers(resp.data)
        }).catch(e => {
          console.error("API Error:", e)
          showMessage("Failed to fetch users", "error")
        }).finally(() => setBusy(false))
    }

    useEffect(function() {
        fetchUsers()
    },[api])

    const showMessage = (message, type = 'success') => {
        setApiMessage(message)
        setMessageType(type)
        setTimeout(() => setApiMessage(null), 5000)
    }

    const handleAddUser = () => {
        if (!newUsername || !newPassword) {
            showMessage("Username and password are required", "error")
            return
        }
        
        setBusy(true)
        api.post(`${apiurl}/users`, {
            username: newUsername,
            password: newPassword
        }).then((resp) => {
            showMessage("User added successfully", "success")
            setShowAddDialog(false)
            setNewUsername('')
            setNewPassword('')
            fetchUsers()
        }).catch(e => {
            console.error("API Error:", e)
            const errorMsg = e.response?.data?.error || "Failed to add user"
            showMessage(errorMsg, "error")
        }).finally(() => setBusy(false))
    }

    const handleDeleteUser = () => {
        setBusy(true)
        api.delete(`${apiurl}/users/${selectedUsername}`).then((resp) => {
            showMessage(`User ${selectedUsername} deleted successfully`, "success")
            setShowDeleteDialog(false)
            setSelectedUsername(null)
            fetchUsers()
        }).catch(e => {
            console.error("API Error:", e)
            const errorMsg = e.response?.data?.error || "Failed to delete user"
            showMessage(errorMsg, "error")
        }).finally(() => setBusy(false))
    }

    const confirmDelete = (username) => {
        setSelectedUsername(username)
        setShowDeleteDialog(true)
    }

    let rows = []

    if (users.length > 0) {
         rows = users.map((r, index) => {
            const isCurrentUser = r.username === auth.user
            return (
            <tr key={index} className="even:bg-gray-50 odd:bg-gray-200">
              <td className="text-left px-4 py-2">
                {r.username}
                {isCurrentUser && <span className="ml-2 text-xs text-blue-600 font-semibold">(You)</span>}
              </td>
              <td className="text-left px-4 py-2 whitespace-nowrap">
                <Button 
                  className="rounded bg-red-600 py-2 px-4 text-xs text-white data-[hover]:bg-red-500 data-[active]:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={() => confirmDelete(r.username)}
                  disabled={isBusy || isCurrentUser}
                  title={isCurrentUser ? "You cannot delete yourself" : "Delete user"}
                >
                  Delete
                </Button>
              </td>
            </tr>
            )
        })
    }

    return (
      <div className="App w-full">

      {isBusy &&
      <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
        <div className="flex justify-center items-center mt-[50vh]">
          <div className="fas fa-circle-notch fa-spin fa-5x text-violet-600"></div>
        </div>
      </div>
      }

      {showAddDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter username"
                  disabled={isBusy}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter password"
                  disabled={isBusy}
                />
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-6">
              <Button 
                className="rounded bg-gray-300 py-2 px-4 text-sm text-gray-800 hover:bg-gray-400"
                onClick={() => {
                  setShowAddDialog(false)
                  setNewUsername('')
                  setNewPassword('')
                }}
                disabled={isBusy}
              >
                Cancel
              </Button>
              <Button 
                className="rounded bg-blue-600 py-2 px-4 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
                onClick={handleAddUser}
                disabled={isBusy}
              >
                Add User
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete user <strong>{selectedUsername}</strong>?</p>
            <div className="flex gap-4 justify-end">
              <Button 
                className="rounded bg-gray-300 py-2 px-4 text-sm text-gray-800 hover:bg-gray-400"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setSelectedUsername(null)
                }}
                disabled={isBusy}
              >
                Cancel
              </Button>
              <Button 
                className="rounded bg-red-600 py-2 px-4 text-sm text-white hover:bg-red-500 disabled:opacity-50"
                onClick={handleDeleteUser}
                disabled={isBusy}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {apiMessage && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          messageType === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {apiMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Users</h1>
        <Button 
          className="rounded bg-blue-600 py-2 px-4 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
          onClick={() => setShowAddDialog(true)}
          disabled={isBusy}
        >
          Add User
        </Button>
      </div>

      <div className="my-5">
        <table className="table-auto bg-gray-100 w-full">
          <thead className="sticky top-0">
            <tr className="bg-slate-300">
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !isBusy &&
        <p className="text-gray-600 text-center mt-4">No users found</p>
      }
    </div>
    )
}
