import { createContext, useEffect, useMemo, useState } from 'react';
import {
  getApiErrorMessage,
  getMe,
  login as loginApi,
  signup as signupApi,
  tokenStore,
} from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const token = tokenStore.get();

      if (!token) {
        if (active) setIsBootstrapping(false);
        return;
      }

      try {
        const data = await getMe();
        if (active) setUser(data.user);
      } catch {
        tokenStore.clear();
        if (active) setUser(null);
      } finally {
        if (active) setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials) => {
    setAuthLoading(true);
    try {
      const data = await loginApi(credentials);
      tokenStore.set(data.accessToken);
      setUser(data.user);
      return data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Login failed'));
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (payload) => {
    setAuthLoading(true);
    try {
      const data = await signupApi(payload);
      tokenStore.set(data.accessToken);
      setUser(data.user);
      return data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Signup failed'));
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      authLoading,
      login,
      signup,
      logout,
    }),
    [user, isBootstrapping, authLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}