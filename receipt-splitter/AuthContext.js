import React, { createContext, useState } from 'react';

// Create the context
export const AuthContext = createContext();

// Provider component that wraps your app
export const AuthProvider = ({ children }) => {
  // You can store any user-related info here (e.g., user ID, token, email, etc.)
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};