import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Auth from "./auth";
import Spinner from "./components/Spinner";
import { useUser } from "./context/UserContext";
import Dashboard from "./pages/Dashboard";
import SmartTreeTagging from "./pages/smart-tree-tagging";
import RecordScanner from "./pages/record-scanner";
import SmartFarmTagging from "./pages/smart-farm-tagging";

function AppRoutes() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<Spinner />}>
            {user ? <Navigate to="/dashboard" /> : <Auth />}
          </Suspense>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Suspense fallback={<Spinner />}>{user ? <Dashboard /> : <Navigate to="/" />}</Suspense>
        }
      >
        <Route
          path="record"
          element={
            <Suspense fallback={<Spinner />}>
              <RecordScanner />
            </Suspense>
          }
        />
        <Route
          path="smart-tree-tagging"
          element={
            <Suspense fallback={<Spinner />}>
              <SmartTreeTagging />
            </Suspense>
          }
        />
        <Route
          path="smart-farm-tagging"
          element={
            <Suspense fallback={<Spinner />}>
              <SmartFarmTagging />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
