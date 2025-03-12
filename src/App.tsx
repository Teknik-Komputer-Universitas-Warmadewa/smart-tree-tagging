import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import Auth from "./auth";
import Dashboard from "./Dashboard";

function AppRoutes() {
  const { user } = useUser();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppRoutes />
      </Router>
    </UserProvider>
  );
}

export default App;
