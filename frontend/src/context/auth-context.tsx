"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/lib/types";
import { API_BASE_URL } from "@/lib/api";

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user?: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Token inválido ou expirado
        localStorage.removeItem("scanner_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      // Falha de rede
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("scanner_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  const login = (newToken: string, newUser?: AuthUser) => {
    localStorage.setItem("scanner_token", newToken);
    document.cookie = `scanner_token=${newToken}; path=/; max-age=86400`;
    setToken(newToken);
    if (newUser) {
      setUser(newUser);
    } else {
      fetchUserProfile(newToken);
    }
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("scanner_token");
    document.cookie =
      "scanner_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
