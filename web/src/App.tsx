import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import { ProtectedRoute } from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import MaintenancePage from './pages/MaintenancePage';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from './lib/socket';
import { apiSlice, useGetPublicSettingsQuery } from './store/apiSlice';
import type { RootState } from './store/store';
const ProfessorVacation = React.lazy(() => import('./pages/dashboard/ProfessorVacation'));
// Enterprise Code Splitting (Lazy Loading) za Dashboard komponente
const DashboardIndex = React.lazy(() => import('./pages/dashboard/DashboardIndex'));
const UsersList = React.lazy(() => import('./pages/dashboard/UsersList'));
const Schedule = React.lazy(() => import('./pages/dashboard/Schedule'));
const Banners = React.lazy(() => import('./pages/dashboard/Banners'));
const Analytics = React.lazy(() => import('./pages/dashboard/Analytics'));
const Settings = React.lazy(() => import('./pages/dashboard/Settings'));
const Certificates = React.lazy(() => import('./pages/dashboard/Certificates'));
const GoogleMeet = React.lazy(() => import('./pages/dashboard/GoogleMeet'));
const MakeupSchedule = React.lazy(() => import('./pages/dashboard/MakeupSchedule'));
const SystemNotifications = React.lazy(() => import('./pages/dashboard/SystemNotifications'));

// Custom Loading Fallback Component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center p-12 min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { data: publicSettings, isLoading: isSettingsLoading } = useGetPublicSettingsQuery();
  const isMaintenanceMode = publicSettings?.maintenanceMode;
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    const socket = getSocket();



    // Globalni zvučni efekat za novu notifikaciju (Meet Raise Hand)
    const playNotificationSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const playBloop = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          
          osc.frequency.setValueAtTime(freq, startTime);
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration + 0.1);
        };

        playBloop(523.25, ctx.currentTime, 0.1); // C5
        playBloop(659.25, ctx.currentTime + 0.08, 0.1); // E5
        playBloop(783.99, ctx.currentTime + 0.16, 0.2); // G5
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

    socket.on('maintenance_changed', (data: { isMaintenance: boolean }) => {
      console.log('Mod održavanja promenjen:', data.isMaintenance);
      dispatch(apiSlice.util.invalidateTags(['Settings']));
    });

    return () => {
      socket.off('users_updated');
      socket.off('new_notification');
      socket.off('maintenance_changed');
    };
  }, [dispatch]);

  if (isSettingsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {isMaintenanceMode && !isAdmin ? (
        <Routes>
          {/* U Maintenance modu, sve rute vode na MaintenancePage, osim Login-a koji je tu da bi admin mogao da udje */}
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<MaintenancePage />} />
        </Routes>
      ) : (
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
                <Suspense fallback={<PageLoader />}>
                  <MainLayout />
                </Suspense>
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
              path="certificates" 
              element={
                <ProtectedRoute allowedRoles={['UCENIK', 'KLIJENT']}>
                  <Certificates />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="vacation" 
              element={
                <ProtectedRoute allowedRoles={['PROFESOR']}>
                  <ProfessorVacation />
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
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
