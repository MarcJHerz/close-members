import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setToken(storedToken);
        try {
          const response = await axios.get('http://192.168.1.87:5000/api/auth/me');
          setUser(response.data.user);
        } catch (error: any) {
          console.error('❌ Error al cargar usuario:', error.response?.data?.error || error.message);
          logout();  // Desconectar al usuario si el token es inválido o expirado
        }
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error('El correo y la contraseña son obligatorios.');
    }
    try {
      const response = await axios.post('http://192.168.1.87:5000/api/auth/login', { email, password });
      console.log('🔑 Respuesta del login:', response.data);
      await AsyncStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setToken(response.data.token);
      setUser(response.data.user);
    } catch (error: any) {
      console.error('❌ Error en login:', error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Credenciales incorrectas');
    }
  };

  const register = async (name: string, username: string, email: string, password: string) => {
    if (!name || !username || !email || !password) {
      throw new Error('Todos los campos son obligatorios.');
    }
    try {
      const response = await axios.post('http://192.168.1.87:5000/api/auth/register', { name, username, email, password });
      await AsyncStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setToken(response.data.token);
      setUser(response.data.user);
    } catch (error: any) {
      console.error('❌ Error en registro:', error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Error al registrar usuario');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
