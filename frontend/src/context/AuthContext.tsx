import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../api/auth';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  googleLogin: (token: string) => Promise<User>;
  register: (firstName: string, lastName: string, email: string, phone: string, address: string, password: string, confirmPassword: string, termsAccepted: boolean) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      authAPI.getProfile()
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await authAPI.login({ email, password });
    const { token } = response.data;

    localStorage.setItem('token', token);

    // Get updated user info from profile endpoint
    const profileResponse = await authAPI.getProfile();
    const userData = profileResponse.data.user;
    setUser(userData);
    return userData;
  };

  const register = async (firstName: string, lastName: string, email: string, phone: string, address: string, password: string, confirmPassword: string, termsAccepted: boolean) => {
    const response = await authAPI.register({ firstName, lastName, email, phone, address, password, confirmPassword, termsAccepted });
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    setUser(user);
  };

  const googleLogin = async (token: string): Promise<User> => {
    const response = await authAPI.googleLogin({ token });
    const { user, token: newToken } = response.data;

    localStorage.setItem('token', newToken);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    googleLogin,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};