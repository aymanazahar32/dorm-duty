import React, { createContext, useContext, useState, useEffect } from "react";

// Create context
const AuthContext = createContext();

// Custom hook for using AuthContext
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate stored user session (replace with real backend later)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("smartdorm_user"));
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // Login simulation (replace with API call)
  const login = (email, password) => {
    const fakeUser = { name: "Md Salman Farse", email };
    localStorage.setItem("smartdorm_user", JSON.stringify(fakeUser));
    setUser(fakeUser);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("smartdorm_user");
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
