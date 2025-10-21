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
<<<<<<< HEAD
  const [isSignedOut, setIsSignedOut] = useState(false)

  useEffect(() => {
    let mounted = true
    
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - forcing completion')
        setLoading(false)
      }
=======

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('Auth loading timeout - forcing completion')
      setLoading(false)
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
    }, 5000) // 5 second timeout

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
<<<<<<< HEAD
      if (!mounted) return
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
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
      
<<<<<<< HEAD
      console.log('Initial session:', session ? 'Found' : 'None')
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch((error) => {
<<<<<<< HEAD
      if (!mounted) return
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
      clearTimeout(loadingTimeout)
      console.error('Failed to get session:', error)
      setSession(null)
      setUser(null)
      setProfile(null)
      setLoading(false)
    })
    
<<<<<<< HEAD
    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
    }
=======
    return () => clearTimeout(loadingTimeout)
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
<<<<<<< HEAD
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
=======
      console.log('Auth state changed:', event)
      
      // Handle token refresh errors
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
<<<<<<< HEAD
      console.log('Fetching profile for user:', userId)
      
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
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
<<<<<<< HEAD
        console.log('Profile error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        setProfile(null)
      } else {
        console.log('Profile fetched successfully:', data)
=======
        setProfile(null)
      } else {
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
    } finally {
<<<<<<< HEAD
      console.log('Setting loading to false')
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
<<<<<<< HEAD
    console.log('SignIn: Starting login process for', email)
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
<<<<<<< HEAD
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
=======
    // Log login activity
    if (data?.user) {
      try {
        await supabase.from('login_activities').insert({
          user_id: data.user.id,
          success: true,
          ip: null, // Will be set by server if needed
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null
        })
      } catch (logError) {
        console.error('Error logging login activity:', logError)
      }
    } else if (error) {
      // Log failed login attempt (if we have user info)
      console.error('Login failed:', error)
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
    }
    
    return { error }
  }

  const signOut = async () => {
<<<<<<< HEAD
    console.log('SignOut: Starting logout process')
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
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
      
<<<<<<< HEAD
      console.log('SignOut: Calling Supabase signOut')
      await supabase.auth.signOut()
      
      console.log('SignOut: Clearing state and storage')
=======
      await supabase.auth.signOut()
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Clear all auth-related storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
<<<<<<< HEAD
        
        // Prevent back button by replacing history
        window.history.pushState(null, '', '/login')
        window.history.replaceState(null, '', '/login')
        
        // Force reload to clear any cached state
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
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
<<<<<<< HEAD
        window.location.href = '/login'
=======
>>>>>>> 763112d2288745be4accd7d405920f14a82fb60d
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
