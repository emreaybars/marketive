import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'

interface AuthUser {
  id: string
  email: string | undefined
  firstName: string | null
  lastName: string | null
  fullName: string | null
  phoneNumber: string | null
  avatarUrl: string | null
  metadata: Record<string, any>
}

interface AuthContextType {
  // Auth state
  isLoaded: boolean
  isSignedIn: boolean
  user: AuthUser | null
  session: Session | null
  supabaseUser: User | null

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string; phoneNumber?: string }) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
  updateProfile: (metadata: { firstName?: string; lastName?: string; phoneNumber?: string }) => Promise<{ error: Error | null }>
  getSession: () => Promise<Session | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function transformUser(user: User | null): AuthUser | null {
  if (!user) return null

  const metadata = user.user_metadata || {}
  const primaryEmail = user.email

  return {
    id: user.id,
    email: primaryEmail,
    firstName: metadata.first_name || metadata.firstName || null,
    lastName: metadata.last_name || metadata.lastName || null,
    fullName: metadata.full_name ||
      (metadata.first_name && metadata.last_name
        ? `${metadata.first_name} ${metadata.last_name}`
        : metadata.firstName && metadata.lastName
          ? `${metadata.firstName} ${metadata.lastName}`
          : null),
    phoneNumber: metadata.phone_number || metadata.phoneNumber || null,
    avatarUrl: metadata.avatar_url || metadata.avatarUrl || user.user_metadata?.picture || null,
    metadata,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)

  // Get session on mount
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()

        if (mounted) {
          setSession(initialSession)
          setSupabaseUser(initialSession?.user ?? null)
          setIsLoaded(true)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        if (mounted) {
          setIsLoaded(true)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (mounted) {
          setSession(newSession)
          setSupabaseUser(newSession?.user ?? null)
          setIsLoaded(true)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (err) {
      return { error: err as Error }
    }
  }, [])

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string; phoneNumber?: string }
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata?.firstName,
            last_name: metadata?.lastName,
            phone_number: metadata?.phoneNumber,
          },
        },
      })

      return { error }
    } catch (err) {
      return { error: err as Error }
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setSupabaseUser(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      return { error }
    } catch (err) {
      return { error: err as Error }
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      return { error }
    } catch (err) {
      return { error: err as Error }
    }
  }, [])

  const updateProfile = useCallback(async (metadata: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
  }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: metadata.firstName,
          last_name: metadata.lastName,
          phone_number: metadata.phoneNumber,
        },
      })

      return { error }
    } catch (err) {
      return { error: err as Error }
    }
  }, [])

  const getSession = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    return currentSession
  }, [])

  const user = transformUser(supabaseUser)
  const isSignedIn = !!session && !!supabaseUser

  const value: AuthContextType = {
    isLoaded,
    isSignedIn,
    user,
    session,
    supabaseUser,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    getSession,
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

export function useUser() {
  const { isLoaded, isSignedIn, user, supabaseUser } = useAuth()
  return {
    isLoaded,
    isSignedIn,
    user,
    supabaseUser,
  }
}

// Hook to get Supabase session token for API calls
export function useSession() {
  const { session, isLoaded } = useAuth()
  return { session, isLoaded }
}

// Hook for accessing the full Supabase user object
export function useSupabaseUser() {
  const { supabaseUser, isLoaded } = useAuth()
  return { user: supabaseUser, isLoaded }
}
