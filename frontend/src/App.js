import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import Preloader from '@/components/Preloader';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CarListingPage from '@/pages/CarListingPage';
import CarDetailPage from '@/pages/CarDetailPage';
import DashboardPage from '@/pages/DashboardPage';
import AdminPage from '@/pages/AdminPage';
import '@/App.css';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cars" element={<CarListingPage />} />
        <Route path="/car/:id" element={<CarDetailPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [showPreloader, setShowPreloader] = useState(true);

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false);
  }, []);

  return (
    <AuthProvider>
      {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}
      <BrowserRouter>
        <div className="App">
          <AnimatedRoutes />
          <Toaster richColors position="bottom-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
