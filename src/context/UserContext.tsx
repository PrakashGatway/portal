import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../axiosInstance'; // Import your axios instance


type AuthContextType = {
  user: any | null;
  token: string | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

        setToken(accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        await fetchUserProfile();
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me'); // Adjust endpoint as needed
      setUser(response.data?.data);
    } catch (err) {
      logout();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // localStorage.removeItem('accessToken');
    // localStorage.removeItem('refreshToken');
    // sessionStorage.removeItem('accessToken');
    // sessionStorage.removeItem('refreshToken');
    await api.get("auth/logout");
    setUser(null);
    setToken(null);
    delete api.defaults.headers.common['Authorization'];
    window.location.href = "https://www.gatewayabroadeducations.com";

  };

  const value = {
    user,
    token,
    logout,
    loading,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};