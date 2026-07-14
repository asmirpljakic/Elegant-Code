import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  firstName?: string;
  lastName?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PROFESOR' | 'UCENIK' | 'KLIJENT' | 'GOST';
  activePackage?: string;
  progress?: {
    currentLevel: number;
    totalClassesAttended: number;
    xp: number;
  };
  exp: number;
  iat: number;
}

interface AuthState {
  token: string | null;
  user: DecodedToken | null;
  isAuthenticated: boolean;
}

const getInitialState = (): AuthState => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      // Provera da li je token istekao
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return { token: null, user: null, isAuthenticated: false };
      }
      return { token, user: decoded, isAuthenticated: true };
    } catch (e) {
      localStorage.removeItem('token');
      return { token: null, user: null, isAuthenticated: false };
    }
  }
  return { token: null, user: null, isAuthenticated: false };
};

const initialState: AuthState = getInitialState();

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string }>
    ) => {
      const decoded = jwtDecode<DecodedToken>(action.payload.token);
      state.token = action.payload.token;
      state.user = decoded;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
