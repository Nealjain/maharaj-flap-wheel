'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserProfile } from './supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSignedOut, setIsSignedOut] = useState(false)

  useEffect(() => {
    let mounted = true
    
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - forcing completion')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return
      clearTimeout(loadingTimeout)
      
      if (error) {
        console.error('Session error:', error)
        // Clear invalid session
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      
      console.log('Initial session:', session ? 'Found' : 'None')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch((error) => {
      if (!mounted) return
      clearTimeout(loadingTimeout)
      console.error('Failed to get session:', error)
      setSession(null)
      setUser(null)
      setProfile(null)
      setLoading(false)
    })
    
    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'no user')
      
      // Update state immediately for all events
      setSession(session)
      setUser(session?.user ?? null)
      
      // Handle different auth events
      if (event === 'SIGNED_IN') {
        console.log('User signed in successfully')
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out - clearing all data')
        setProfile(null)
        setLoading(false)
        setIsSignedOut(true)
        // Clear all storage to prevent back button access
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
          localStorage.setItem('signed_out', 'true')
          // Force reload to clear any cached state
          window.location.href = '/login'
        }
      } else if (event === 'USER_UPDATED') {
        console.log('User updated')
      } else {
        // Handle other events
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      
      // Add timeout for profile fetch
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      )
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      if (error) {
        console.error('Error fetching user profile:', error)
        console.log('Profile error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        setProfile(null)
      } else {
        console.log('Profile fetched successfully:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('SignIn: Starting login process for', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('SignIn: Login failed:', error)
      return { error }
    }
    
    console.log('SignIn: Auth successful, user:', data.user?.email)
    
    // Set user and session immediately
    if (data?.user && data?.session) {
      console.log('SignIn: Setting user and session state')
      setUser(data.user)
      setSession(data.session)
      
      // Fetch profile
      console.log('SignIn: Fetching user profile...')
      try {
        await fetchUserProfile(data.user.id)
        console.log('SignIn: Profile fetched successfully')
        
        // Log login activity
        await supabase.from('login_activities').insert({
          user_id: data.user.id,
          success: true,
          ip: null,
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null
        })
      } catch (logError) {
        console.error('SignIn: Error in post-login process:', logError)
      }
    }
    
    return { error }
  }

  const signOut = async () => {
    console.log('SignOut: Starting logout process')
    setLoading(true)
    try {
      // Log logout activity before signing out
      if (user) {
        try {
          await supabase.from('audit_logs').insert({
            event_type: 'LOGOUT',
            entity: 'auth',
            entity_id: user.id,
            performed_by: user.id,
            payload: { timestamp: new Date().toISOString() }
          })
        } catch (logError) {
          console.error('Error logging logout activity:', logError)
        }
      }
      
      console.log('SignOut: Calling Supabase signOut')
      await supabase.auth.signOut()
      
      console.log('SignOut: Clearing state and storage')
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Clear all auth-related storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        // Prevent back button by replacing history
        window.history.pushState(null, '', '/login')
        window.history.replaceState(null, '', '/login')
        
        // Force reload to clear any cached state
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      }
    } catch (error) {
      console.error('Error signing out:', error)
      // Force clear state even if signOut fails
      setUser(null)
      setProfile(null)
      setSession(null)
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = profile?.role === 'admin'

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
