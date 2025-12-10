
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const ThemeContext = createContext()

export const themes = {
  classic: 'Classic Blue',
  agri: 'Agri Green',
  sunset: 'Sunset Orange',
  royal: 'Royal Purple',
  dark: 'Dark Mode'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('classic')

  useEffect(() => {
    // Load saved theme from localStorage first
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme)
    }

    // Attempt to fetch from Supabase if user is logged in
    const fetchProfileTheme = async () => {
      // [TESTING MODE] Check localStorage first
      const localUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      let userId = null

      if (localUser) {
         userId = JSON.parse(localUser).id
      } else {
         const { data: { user } } = await supabase.auth.getUser()
         if (user) userId = user.id
      }

      if (userId) {
        // In "Real" mode this is 'profiles', in "Test" mode we might store theme in 'app_users' too?
        // For simplicity, let's just stick to localStorage for theme persistence in Test Mode if profiles table isn't used.
        // But if we want to support 'profiles' table for test user, we need a policy there too.
        // Let's just persist theme in localStorage for now as it already does that.
        
        // Optional: fetch from profiles if you manually linked app_users to profiles (mock setup)
      }
    }

    fetchProfileTheme()
  }, [])

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    
    // If user is logged in, save to Supabase (debounced ideally, but direct here for simplicity)
    const saveToProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .upsert({ id: user.id, theme_preference: theme })
      }
    }
    
    // Only save if changed? simple implementation for now
    saveToProfile()

  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
