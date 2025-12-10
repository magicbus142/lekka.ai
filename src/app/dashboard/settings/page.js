
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Lock, Users, X } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { themes } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabaseClient'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [passwords, setPasswords] = useState({ new: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Member Management State
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [memberForm, setMemberForm] = useState({ email: '', password: '', role: 'viewer' })
  
  // Profile State
  const [profile, setProfile] = useState({ shopName: '', email: '' })
  
  // Fetch data on mount
  useState(() => {
     fetchMembers()
     fetchProfile()
  }, [])
  
  async function fetchProfile() {
      try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
              const { data } = await supabase.from('profiles').select('shop_name').eq('id', user.id).single()
              setProfile({
                  email: user.email,
                  shopName: data?.shop_name || ''
              })
          }
      } catch (e) {
          console.error("Failed to fetch profile", e)
      }
  }
  
  async function fetchMembers() {
      setMembersLoading(true)
      try {
          // Use client-side fetch for listing (allowed by RLS)
          const { data, error } = await supabase
              .from('user_roles')
              .select('*')
              .order('created_at', { ascending: false })

          if (error) throw error
          setMembers(data || [])
      } catch (e) {
          console.error("Failed to list members", e)
      } finally {
          setMembersLoading(false)
      }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (passwords.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({ password: passwords.new })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully' })
      setPasswords({ new: '', confirm: '' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating password: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleMemberSubmit = async (e) => {
      e.preventDefault()
      try {
          setLoading(true)
          const isEdit = !!editingMember
          
          const payload = { ...memberForm }
          if (isEdit) payload.id = editingMember.user_id

          const method = isEdit ? 'PUT' : 'POST'
          const res = await fetch('/api/members', {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          })
          
          const data = await res.json()
          
          if (!res.ok) throw new Error(data.error || 'Operation failed')
          
          alert(isEdit ? 'Member updated successfully' : 'Member added successfully')
          setShowMemberModal(false)
          setMemberForm({ email: '', password: '', role: 'viewer' })
          setEditingMember(null)
          fetchMembers()

      } catch (error) {
          alert(error.message)
      } finally {
          setLoading(false)
      }
  }

  const handleDeleteMember = async (id) => {
      if (!confirm('Are you sure you want to remove this member?')) return
      try {
          const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Failed to delete')
          fetchMembers()
      } catch (e) {
          alert(e.message)
      }
  }
  
  const openEdit = (member) => {
      setEditingMember(member)
      setMemberForm({ email: member.email, password: '', role: member.role })
      setShowMemberModal(true)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your shop preferences and team.</p>
      </div>
      
      {/* Team Members Section */}
      <div className="bg-card border border-border rounded-xl p-6">
         <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-semibold flex items-center gap-2">
               <Users className="w-5 h-5" /> Team Members
             </h3>
             <button 
               onClick={() => {
                   setEditingMember(null)
                   setMemberForm({ email: '', password: '', role: 'viewer' })
                   setShowMemberModal(true) 
               }}
               className="text-sm bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium hover:bg-primary/90"
             >
               Add Member
             </button>
         </div>
         
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                     <tr>
                         <th className="px-4 py-3">Email</th>
                         <th className="px-4 py-3">Role</th>
                         <th className="px-4 py-3 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                     {membersLoading ? (
                         <tr><td colSpan="3" className="p-4 text-center">Loading...</td></tr>
                     ) : members.length === 0 ? (
                         <tr><td colSpan="3" className="p-4 text-center text-muted-foreground">No team members yet.</td></tr>
                     ) : (
                         members.map(m => (
                             <tr key={m.id}>
                                 <td className="px-4 py-3">{m.email}</td>
                                 <td className="px-4 py-3 capitalize">
                                     <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                         {m.role}
                                     </span>
                                 </td>
                                 <td className="px-4 py-3 text-right flex justify-end gap-2">
                                     <button onClick={() => openEdit(m)} className="text-primary hover:underline">Edit</button>
                                     <button onClick={() => handleDeleteMember(m.user_id)} className="text-red-500 hover:underline">Remove</button>
                                 </td>
                             </tr>
                         ))
                     )}
                 </tbody>
             </table>
         </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
         <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
           <Lock className="w-5 h-5" /> Security
         </h3>
         <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                {message.text}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <input 
                type="password" 
                required
                minLength={6}
                className="w-full px-3 py-2 border border-input rounded-md bg-background" 
                placeholder="Enter new password"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <input 
                type="password" 
                required
                minLength={6}
                className="w-full px-3 py-2 border border-input rounded-md bg-background" 
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Update Password...' : 'Update Password'}
            </button>
         </form>
      </div>


      <div className="bg-card border border-border rounded-xl p-6">
         <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
           <Settings className="w-5 h-5" /> Appearance
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(themes).map(([key, label]) => {
              const colors = {
                  classic: 'bg-blue-600',
                  agri: 'bg-green-600',
                  sunset: 'bg-orange-600',
                  royal: 'bg-purple-600',
                  dark: 'bg-slate-950'
              }
              return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group flex items-center gap-3 ${
                      theme === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border border-black/10 shadow-sm ${colors[key] || 'bg-gray-200'}`} />
                    <span className="font-medium text-sm">{label}</span>
                  </button>
              )
            })}
         </div>
      </div>
      
      {/* Add/Edit Member Modal */}
      {showMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="text-xl font-bold">{editingMember ? 'Edit Member' : 'Add Member'}</h3>
                    <button onClick={() => setShowMemberModal(false)} className="p-1 hover:bg-black/10 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleMemberSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input 
                            required 
                            type="email"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                            value={memberForm.email}
                            onChange={e => setMemberForm({...memberForm, email: e.target.value})}
                            disabled={!!editingMember} 
                        />
                        {editingMember && <p className="text-xs text-muted-foreground">Email cannot be changed.</p>}
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <input 
                            type="password"
                            minLength={6}
                            required={!editingMember}
                            placeholder={editingMember ? "Leave blank to keep current" : "Set password"}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                            value={memberForm.password}
                            onChange={e => setMemberForm({...memberForm, password: e.target.value})}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <select 
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                            value={memberForm.role}
                            onChange={e => setMemberForm({...memberForm, role: e.target.value})}
                        >
                            <option value="viewer">Viewer (View Only)</option>
                            <option value="editor">Editor (Edit & View)</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowMemberModal(false)} className="px-4 py-2 text-sm hover:bg-muted rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
                            {loading ? 'Saving...' : 'Save Member'}
                        </button>
                    </div>
                </form>
            </motion.div>
          </div>
      )}
    </motion.div>
  )
}
