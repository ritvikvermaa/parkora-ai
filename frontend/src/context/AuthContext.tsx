import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const savedUser =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    const savedToken =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      sessionStorage.setItem("user", savedUser);
    }

    if (savedToken) {
      setToken(savedToken);
      (globalThis as any).__PARKORA_AUTH_TOKEN__ = savedToken;
      sessionStorage.setItem("token", savedToken);
    }

    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      (globalThis as any).__PARKORA_AUTH_TOKEN__ = token;
      sessionStorage.setItem("token", token);
    }

    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
    }
  }, [token, user]);

  const login = (data: any) => {
    (globalThis as any).__PARKORA_AUTH_TOKEN__ = data.token;
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    delete (globalThis as any).__PARKORA_AUTH_TOKEN__;
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
