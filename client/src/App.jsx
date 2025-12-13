import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HabitTracker from './pages/HabitTracker';
import GoalPlanner from './pages/GoalPlanner';
import BrainDump from './pages/BrainDump';
import Finance from './pages/Finance';
import TaskManager from './pages/TaskManager';
import PrayerTracker from './pages/PrayerTracker';
import Login from './pages/Login';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { AuthProvider, useAuth } from './context/AuthContext';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = () => {
    const { token, loading } = useAuth();
    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    return token ? <Outlet /> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster position="bottom-right" toastOptions={{
            className: 'border border-gray-200 shadow-lg text-sm font-medium',
            style: { background: '#fff', color: '#000' }
          }}/>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="tasks" element={<TaskManager />} />
                    <Route path="habits" element={<HabitTracker />} />
                    <Route path="goals" element={<GoalPlanner />} />
                    <Route path="dump" element={<BrainDump />} />
                    <Route path="finance" element={<Finance />} />
                    <Route path="prayer" element={<PrayerTracker />} />
                    <Route path="privacy" element={<PrivacyPolicy />} />
                    <Route path="terms" element={<TermsOfService />} />
                  </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
