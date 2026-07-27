import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/client";
import { decodeJWT } from "../api/jwt";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/api/auth/token/", { username, password });
      const claims = decodeJWT(data.access);

      const userInfo = {
        id: claims.user_id,
        username: claims.username,
        email: claims.email,
        role: claims.role,
        department_id: claims.department_id,
      };

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user", JSON.stringify(userInfo));
      setUser(userInfo);
      return true;
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Couldn't sign in — check the username and password.";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const canSeeAllDepartments = ["ADMIN", "CEO", "CTO", "HR"].includes(user?.role);
  const isTeamLead = user?.role === "TEAM_LEAD";
  const isFinance = user?.role === "FINANCE";
  const isHR = user?.role === "HR";
  const isCEO = user?.role === "CEO";
  const isCTO = user?.role === "CTO";
  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        error,
        loading,
        canSeeAllDepartments,
        isTeamLead,
        isFinance,
        isHR,
        isCEO,
        isCTO,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
