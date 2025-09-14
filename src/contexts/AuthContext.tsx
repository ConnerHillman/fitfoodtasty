import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { createContextHook } from './contextUtils';

// Auth state and actions
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

type AuthAction = 
  | { type: 'SET_SESSION'; payload: { session: Session | null; user: User | null } }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        session: action.payload.session,
        user: action.payload.user,
        loading: false
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use the generic context hook creator
export const useAuth = createContextHook(AuthContext, 'Auth');

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    session: null,
    loading: true
  });

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        dispatch({
          type: 'SET_SESSION',
          payload: { session, user: session?.user ?? null }
        });
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({
        type: 'SET_SESSION',
        payload: { session, user: session?.user ?? null }
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    ...state,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};