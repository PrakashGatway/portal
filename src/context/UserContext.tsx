import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import api from '../axiosInstance';

type AuthContextType = {
  user: any | null;
  token: string | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
};
import { io } from "socket.io-client";
import { toast } from 'react-toastify';



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [wallet, setWallet] = useState() as any;
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    if (!user) return;

    const allowedRoles = ["admin", "leader", "counselor"];

    if (!allowedRoles.includes(user.role)) return;

    const socket = io("http://localhost:5001/lead-notifications", {
      auth: {
        token: localStorage.getItem("accessToken"),
      }
    });

    socket.on("connect", () => {
      console.log("Lead socket connected");
    });

    socket.on("leadAssigned", (lead) => {
      const audio = new Audio("/notify.mp3");
      audio.play();
      toast.success(`New Lead Assigned: ${lead.name}`, {
        position: "top-center"
      });
    });

    return () => {
      socket.disconnect();
    };

  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data?.data);
      setWallet(response.data?.wallet);
    } catch (err) {
      logout();
      throw err;
    }
  };

  useEffect(() => {
    if (user && !user?.category?._id) {
      navigate('/course/category');
    }
    console.log('clicked')
  }, [user, location.pathname]);


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
    wallet,
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