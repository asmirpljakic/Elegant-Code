import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import { ProtectedRoute } from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DashboardIndex from './pages/dashboard/DashboardIndex';
import UsersList from './pages/dashboard/UsersList';
import Schedule from './pages/dashboard/Schedule';
import Analytics from './pages/dashboard/Analytics';
import Settings from './pages/dashboard/Settings';
import Certificates from './pages/dashboard/Certificates';
import GoogleMeet from './pages/dashboard/GoogleMeet';
import MakeupSchedule from './pages/dashboard/MakeupSchedule';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        
        {/* Zaštićene Rute */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default dashboard stranica */}
          <Route index element={<DashboardIndex />} />
          
          {/* Ostale stranice unutar Layout-a */}
          <Route path="schedule" element={<Schedule />} />
          <Route 
            path="makeup-schedule" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PROFESOR']}>
                <MakeupSchedule />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="users" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PROFESOR']}>
                <UsersList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="google-meet" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PROFESOR']}>
                <GoogleMeet />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="analytics" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="settings" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="certificates" 
            element={
              <ProtectedRoute allowedRoles={['UCENIK', 'KLIJENT']}>
                <Certificates />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
