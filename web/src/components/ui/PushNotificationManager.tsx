import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

// Helper za konverziju base64 VAPID ključa
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const PushNotificationManager = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Greška pri proveri push pretplate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      setIsLoading(true);
      
      // Tražimo dozvolu od korisnika
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Morate dozvoliti notifikacije u pretraživaču kako biste primali obaveštenja.');
        setIsLoading(false);
        return;
      }

      // Preuzimamo VAPID public key sa servera
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/notifications/vapid-key`);
      const { publicKey } = await response.json();

      if (!publicKey) {
        throw new Error('VAPID ključ nije pronađen.');
      }

      // Registrujemo Service Worker (PWA kompajlira sw.ts u sw.js)
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Pravimo pretplatu
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Šaljemo pretplatu na naš backend
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });

      setIsSubscribed(true);
      alert('Uspešno ste aktivirali Push Notifikacije na ovom uređaju!');
    } catch (error) {
      console.error('Greška pri pretplati:', error);
      alert('Došlo je do greške pri aktivaciji notifikacija.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported || !user) return null;

  return (
    <div className="mt-auto p-4 border-t border-slate-800">
      <button
        onClick={isSubscribed ? undefined : subscribeToPush}
        disabled={isLoading || isSubscribed}
        className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
          isSubscribed
            ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <>
            <Bell className="w-4 h-4" />
            <span>Notifikacije Uključene</span>
          </>
        ) : (
          <>
            <BellOff className="w-4 h-4" />
            <span>Aktiviraj Obaveštenja</span>
          </>
        )}
      </button>
    </div>
  );
};
