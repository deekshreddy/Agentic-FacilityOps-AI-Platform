import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  clearSession,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type User,
} from '../services/authService';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());

  const login = async (email: string, password: string, rememberMe: boolean): Promise<User> => {
    const authenticatedUser = await loginUser(email, password, rememberMe);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    return registerUser(name, email, password);
  };

  const logout = (): void => {
    logoutUser();
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
