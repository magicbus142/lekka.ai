
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, Utensils, Pill, ShoppingBag, ArrowRight } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

const SHOP_TYPES = [
  { id: 'Kirana', label: 'Kirana / Grocery', icon: Store, theme: 'agri' },
  { id: 'Medical', label: 'Medical Shop', icon: Pill, theme: 'classic' },
  { id: 'Restaurant', label: 'Restaurant / Cafe', icon: Utensils, theme: 'sunset' },
  { id: 'Other', label: 'Retail / Other', icon: ShoppingBag, theme: 'royal' },
]

const DEFAULT_PRODUCTS = {
  Kirana: [
    { name: 'Sona Masoori Rice (25kg)', sku: 'RICE-001', stock: 10, min_stock_level: 5, price: 1250 },
    { name: 'Toor Dal (1kg)', sku: 'DAL-001', stock: 50, min_stock_level: 10, price: 160 },
    { name: 'Sunflower Oil (1L)', sku: 'OIL-001', stock: 30, min_stock_level: 10, price: 110 },
    { name: 'Sugar (1kg)', sku: 'SUG-001', stock: 100, min_stock_level: 20, price: 45 }
  ],
  Medical: [
    { name: 'Paracetamol 650mg', sku: 'MED-001', stock: 500, min_stock_level: 100, price: 30 },
    { name: 'Vitamin C Tablets', sku: 'MED-002', stock: 200, min_stock_level: 50, price: 80 },
    { name: 'N95 Mask', sku: 'MSK-001', stock: 100, min_stock_level: 20, price: 40 },
    { name: 'Hand Sanitizer (100ml)', sku: 'SAN-001', stock: 50, min_stock_level: 10, price: 50 }
  ],
  Restaurant: [
    { name: 'Chicken Biryani', sku: 'FD-001', stock: 20, min_stock_level: 5, price: 250 },
    { name: 'Veg Meals', sku: 'FD-002', stock: 30, min_stock_level: 10, price: 120 },
    { name: 'Coca Cola (500ml)', sku: 'DRK-001', stock: 48, min_stock_level: 12, price: 40 },
    { name: 'Mineral Water', sku: 'DRK-002', stock: 100, min_stock_level: 20, price: 20 }
  ],
  Other: [
    { name: 'Notebook (Long)', sku: 'STAT-001', stock: 200, min_stock_level: 50, price: 60 },
    { name: 'Ball Pen (Blue)', sku: 'STAT-002', stock: 500, min_stock_level: 100, price: 10 }
  ]
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [shopName, setShopName] = useState('')
  const [shopType, setShopType] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  const handleFinish = async () => {
    if (!shopName || !shopType) return
    setLoading(true)

    const selectedTypeConfig = SHOP_TYPES.find(t => t.id === shopType)
    const presetTheme = selectedTypeConfig?.theme || 'classic'

    // Update Theme Context immediately for immediate feedback
    setTheme(presetTheme)

    // [TESTING MODE] Support for Mock User
    let userId = null
    let { data: { user } } = await supabase.auth.getUser()

    if (!user) {
       // Check localStorage for mock user
       const localUser = localStorage.getItem('user')
       if (localUser) {
          const parsed = JSON.parse(localUser)
          userId = parsed.id
          // Mocking the user object structure slightly for consistency if needed, 
          // but we mainly need userId
       }
    } else {
       userId = user.id
    }

    if (userId) {
      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          shop_name: shopName,
          shop_type: shopType,
          theme_preference: presetTheme
        })

      if (profileError) {
         console.error('Error updating profile:', profileError.message, profileError.details, profileError.hint)
         // Proceeding anyway for testing...
      }

      // 2. Seed Default Inventory
      const defaultItems = DEFAULT_PRODUCTS[shopType] || []
      if (defaultItems.length > 0) {
          const productsToInsert = defaultItems.map(item => ({
            ...item,
            user_id: userId
          }))
          
          const { error: seedError } = await supabase.from('products').insert(productsToInsert)
          if (seedError) console.error('Error seeding inventory:', seedError)
      }

      router.push('/dashboard')
    } else {
       setLoading(false)
       alert('No user found! Please login.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-secondary/40 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        layout
        className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl p-8 overflow-hidden"
      >
        <div className="mb-8">
           <div className="flex gap-2 mb-4">
             <div className={`h-1.5 rounded-full flex-1 transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
             <div className={`h-1.5 rounded-full flex-1 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
           </div>
           <h2 className="text-2xl font-bold">
             {step === 1 ? "What is your Shop's Name?" : "What kind of business is it?"}
           </h2>
           <p className="text-muted-foreground">
             {step === 1 ? "Let's give your dashboard a personal touch." : "We will customize the app for your needs."}
           </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <input
                type="text"
                autoFocus
                className="w-full text-3xl font-bold bg-transparent border-b-2 border-input focus:border-primary focus:outline-none py-2 px-1 placeholder:text-muted-foreground/30"
                placeholder="My Awesome Shop"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  disabled={!shopName.trim()}
                  onClick={() => setStep(2)}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                {SHOP_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setShopType(type.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                        shopType === type.id 
                        ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <type.icon className={`w-8 h-8 mb-3 ${shopType === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="font-semibold">{type.label}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4">
                 <button 
                   onClick={() => setStep(1)}
                   className="text-muted-foreground hover:text-foreground font-medium px-4"
                 >
                   Back
                 </button>
                <button
                  disabled={!shopType || loading}
                  onClick={handleFinish}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold flex items-center gap-2 disabled:opacity-50 shadow-lg hover:bg-primary/90 transition-colors"
                >
                  {loading ? 'Setting up...' : 'Finish Setup'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
