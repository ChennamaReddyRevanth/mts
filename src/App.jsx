import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";

import LoginPage        from "./pages/LoginPage";
import DashboardPage    from "./pages/DashboardPage";
import AllTicketsPage   from "./pages/AllTicketsPage";
import MyTicketsPage    from "./pages/MyTicketsPage";
import SubmitTicketPage from "./pages/SubmitTicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import RulesPage        from "./pages/RulesPage";

// Route guard — requires login
function PrivateRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

// Route guard — requires admin/manager
function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin)   return <Navigate to="/my-tickets" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/submit-ticket" element={<SubmitTicketPage />} />
        <Route path="/my-tickets"    element={<MyTicketsPage />} />

        {/* Auth-required */}
        <Route path="/ticket/:id" element={
          <PrivateRoute><TicketDetailPage /></PrivateRoute>
        } />

        {/* Admin-only */}
        <Route path="/dashboard"   element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/all-tickets" element={<AdminRoute><AllTicketsPage /></AdminRoute>} />
        <Route path="/rules"       element={<AdminRoute><RulesPage /></AdminRoute>} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
