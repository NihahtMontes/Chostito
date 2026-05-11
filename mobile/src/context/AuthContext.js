import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/auth';
import { setToken, getToken, setUser, getUser, clearAuth } from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Chequear sesión al iniciar la app
    const checkSession = async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();
        if (storedToken && storedUser) {
          setUserState(storedUser);
        }
      } catch (error) {
        console.error('Error al recuperar sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    const { token, ...userData } = data;
    await setToken(token);
    await setUser(userData);
    setUserState(userData);
    return userData;
  };

  const logout = async () => {
    await clearAuth();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
