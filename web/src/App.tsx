import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import { ProtectedRoute } from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DashboardIndex from './pages/dashboard/DashboardIndex';
import UsersList from './pages/dashboard/UsersList';
import Schedule from './pages/dashboard/Schedule';
import Banners from './pages/dashboard/Banners';
import Analytics from './pages/dashboard/Analytics';
import Settings from './pages/dashboard/Settings';
import Certificates from './pages/dashboard/Certificates';
import GoogleMeet from './pages/dashboard/GoogleMeet';
import MakeupSchedule from './pages/dashboard/MakeupSchedule';
import SystemNotifications from './pages/dashboard/SystemNotifications';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getSocket } from './lib/socket';
import { apiSlice } from './store/apiSlice';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = getSocket();

    // Zvučni efekat za novu notifikaciju
    const playNotificationSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Prijatan, nenametljiv dupli "ping" zvuk
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (err) {
        console.log("Audio autoplay blocked or not supported", err);
      }
    };

    socket.on('users_updated', () => {
      console.log('Primljen users_updated signal, osvežavam podatke...');
      dispatch(apiSlice.util.invalidateTags(['Users', 'ClassSession', 'User']));
    });

    socket.on('new_notification', () => {
      console.log('Stigla je nova notifikacija!');
      dispatch(apiSlice.util.invalidateTags(['Notifications']));
      playNotificationSound();
    });

    return () => {
      socket.off('users_updated');
      socket.off('new_notification');
    };
  }, [dispatch]);
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
          <Route path="analytics" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <Analytics />
            </ProtectedRoute>
          } />
          
          <Route path="banners" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <Banners />
            </ProtectedRoute>
          } />
          <Route path="system-notifications" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <SystemNotifications />
            </ProtectedRoute>
          } />
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
