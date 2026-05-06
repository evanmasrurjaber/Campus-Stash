import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  forgotPassword as forgotPasswordApi,
  getApiErrorMessage,
  getMe,
  login as loginApi,
  resetPassword as resetPasswordApi,
  signup as signupApi,
  verifyEmail as verifyEmailApi,
  resendCode as resendCodeApi,
  tokenStore,
} from '../services/api';
import { AuthContext } from './AuthContextBase';

const normalizeUser = (value) => {
  if (!value) {
    return null;
  }

  const id = value.id || value._id || '';
  return {
    ...value,
    id,
    _id: value._id || id,
  };
};

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
        if (active) setUser(normalizeUser(data.user));
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
      setUser(normalizeUser(data.user));
      return data;
    } catch (error) {
      // Check if it's an unverified email error (403)
      if (error.response?.status === 403) {
        const err = new Error(getApiErrorMessage(error, 'Email not verified'));
        err.code = 'EMAIL_NOT_VERIFIED';
        err.email = credentials.email;
        throw err;
      }
      throw new Error(getApiErrorMessage(error, 'Login failed'));
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (payload) => {
    setAuthLoading(true);
    try {
      const data = await signupApi(payload);
      // Signup should not create an authenticated session until email is verified.
      tokenStore.clear();
      setUser(null);
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

  const verifyEmail = async (code) => {
    setAuthLoading(true);
    try {
      const data = await verifyEmailApi(code);
      tokenStore.set(data.accessToken);
      setUser(normalizeUser(data.user));
      return data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Email verification failed'));
    } finally {
      setAuthLoading(false);
    }
  };

  const resendCode = async (email) => {
    setAuthLoading(true);
    try {
      const data = await resendCodeApi(email);
      return data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to resend verification code'));
    } finally {
      setAuthLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setAuthLoading(true);
    try {
      const data = await forgotPasswordApi(email);
      return data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to send reset code'));
    } finally {
      setAuthLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    setAuthLoading(true);
    try {
      const data = await resetPasswordApi(token, newPassword);
      return data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to reset password'));
    } finally {
      setAuthLoading(false);
    }
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
      verifyEmail,
      resendCode,
      forgotPassword,
      resetPassword,
    }),
    [user, isBootstrapping, authLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}