// eslint-disable-next-line react-refresh/only-export-components
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { signIn as apiSignIn, signUp as apiSignUp } from '../api/client';
import type { UserOut } from '../types';

// ─── Types ───────────────────────────────────────────────────────────

interface AuthState {
  user: UserOut | null;
  token: string | null;
  /** True while we are reading the stored token on first mount. */
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  // On mount, restore token + user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      try {
        const user: UserOut = JSON.parse(userJson);
        setState({ user, token, isLoading: false });
      } catch {
        // Corrupted storage — clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setState({ user: null, token: null, isLoading: false });
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }

    // Listen for forced logout triggered by the Axios 401 interceptor
    const handleForcedLogout = () => {
      setState({ user: null, token: null, isLoading: false });
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const _persist = useCallback((token: string, user: UserOut) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setState({ user, token, isLoading: false });
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await apiSignIn(email, password);
      _persist(res.access_token, res.user);
    },
    [_persist]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const res = await apiSignUp(email, password);
      _persist(res.access_token, res.user);
    },
    [_persist]
  );

  const signOut = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setState({ user: null, token: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
