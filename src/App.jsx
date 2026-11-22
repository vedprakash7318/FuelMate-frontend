import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MobileLayout from './components/Layout/MobileLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Regular Pump Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FuelFilling from './pages/FuelFilling';
import ReceivePayment from './pages/ReceivePayment';
import Owners from './pages/Owners';
import OwnerDetail from './pages/OwnerDetail';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import KhataLedger from './pages/KhataLedger';
import FuelTransactions from './pages/FuelTransactions';
import PaymentsList from './pages/PaymentsList';
import FuelPrices from './pages/FuelPrices';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <MobileLayout>{children}</MobileLayout>;
};

const OwnerRoute = ({ children }) => {
  const { user, isOwner, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isOwner) return <Navigate to="/dashboard" replace />;
  return <MobileLayout>{children}</MobileLayout>;
};

const App = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* ========================================================= */}
      {/* PUMP OPERATIONAL ROUTES (Owner & Staff Mobile Layout)   */}
      {/* ========================================================= */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fuel/new"
        element={
          <ProtectedRoute>
            <FuelFilling />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments/new"
        element={
          <ProtectedRoute>
            <ReceivePayment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owners"
        element={
          <ProtectedRoute>
            <Owners />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owners/add"
        element={
          <ProtectedRoute>
            <Owners />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owners/:id"
        element={
          <ProtectedRoute>
            <OwnerDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/add"
        element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/:id"
        element={
          <ProtectedRoute>
            <VehicleDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fuel"
        element={
          <ProtectedRoute>
            <FuelTransactions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <PaymentsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ledger"
        element={
          <ProtectedRoute>
            <KhataLedger />
          </ProtectedRoute>
        }
      />

      {/* Owner-Only Routes */}
      <Route
        path="/fuel-prices"
        element={
          <OwnerRoute>
            <FuelPrices />
          </OwnerRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <OwnerRoute>
            <Employees />
          </OwnerRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <OwnerRoute>
            <Reports />
          </OwnerRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <OwnerRoute>
            <Settings />
          </OwnerRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
