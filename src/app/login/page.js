'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // [TESTING MODE] Check against app_users table
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .eq('password', password) // INSECURE: Testing only
      .single()

    if (error || !data) {
      setError('Invalid credentials (Try test@shopsync.ai / 123456)')
      setLoading(false)
    } else {
      // Set a cookie for middleware
      document.cookie = `mock_session=${data.id}; path=/`
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(data))
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8"
      >
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Login Form</h2>

        {/* Toggle Switch */}
        <div className="flex bg-white border border-gray-200 rounded-full p-1 mb-6 relative shadow-sm">
           <button 
             className="flex-1 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md transition-all"
           >
             Login
           </button>
           <Link href="/signup" className="flex-1">
            <button 
                type="button"
                className="w-full py-2 rounded-full text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all"
            >
                Signup
            </button>
           </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="text-left">
                <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center"
            >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Login'}
            </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Not a member?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline font-semibold">
            Signup now
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
