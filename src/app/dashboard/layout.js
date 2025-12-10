
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { LayoutDashboard, ReceiptIndianRupee, PieChart, Settings, LogOut, Menu, X, Package, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: Package, label: 'Inventory', href: '/dashboard/inventory' },
  { icon: Users, label: 'Workers', href: '/dashboard/workers' },
  { icon: ReceiptIndianRupee, label: 'Transactions', href: '/dashboard/transactions' },
  { icon: PieChart, label: 'Reports', href: '/dashboard/reports' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function DashboardLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [shopName, setShopName] = useState('ShopSync')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchShopName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('shop_name').eq('id', user.id).single()
          if (data?.shop_name) setShopName(data.shop_name)
        }
      } catch (error) {
        console.error('Error fetching shop name:', error)
      }
    }
    fetchShopName()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-card rounded-full shadow-lg border border-border"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-card border-r border-border p-6 flex flex-col z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-8 px-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
              {shopName}
            </h1>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto py-2">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="pt-4 mt-auto border-t border-border">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all font-medium"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden md:ml-0">
        <div className="max-w-7xl mx-auto space-y-8">
            {children}
        </div>
      </main>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
