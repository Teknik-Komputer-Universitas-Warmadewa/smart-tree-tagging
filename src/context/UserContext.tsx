/* eslint-disable react-refresh/only-export-components */
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const userData = { email: currentUser.email }; // Store minimal data
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(currentUser);
      } else {
        localStorage.removeItem("user");
        setUser(null);
      }
      setLoading(false); // ✅ Set loading to false after checking authentication
    });

    return () => unsubscribe();
  }, []);
  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};
