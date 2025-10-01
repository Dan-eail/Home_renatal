import { create } from 'zustand';
import { User, Property, Booking } from '@/types';
import { authAPI } from '@/api/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, role: 'tenant' | 'landlord') => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('token', response.token);
      set({ user: response.user, token: response.token });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name: string, email: string, phone: string, password: string, role: 'tenant' | 'landlord') => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register({ name, email, phone, password, role });
      localStorage.setItem('token', response.token);
      set({ user: response.user, token: response.token });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, token: null });
      return;
    }
    try {
      const response = await authAPI.getMe();
      set({ user: response.user, token });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  updateProfile: async (data: Partial<User>) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.updateProfile(data);
      set({ user: response.user });
    } finally {
      set({ isLoading: false });
    }
  },
}));

interface PropertyStore {
  properties: Property[];
  selectedProperty: Property | null;
  isLoading: boolean;
  setProperties: (properties: Property[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  setLoading: (loading: boolean) => void;
}

export const usePropertyStore = create<PropertyStore>((set) => ({
  properties: [],
  selectedProperty: null,
  isLoading: false,
  setProperties: (properties: Property[]) => set({ properties }),
  setSelectedProperty: (property: Property | null) => set({ selectedProperty: property }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));

interface BookingStore {
  bookings: Booking[];
  isLoading: boolean;
  setBookings: (bookings: Booking[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  isLoading: false,
  setBookings: (bookings: Booking[]) => set({ bookings }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
