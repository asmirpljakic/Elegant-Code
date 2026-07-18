import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation
} from '../../store/apiSlice';
import { cn } from '../../lib/utils';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [visibleCount, setVisibleCount] = useState(6);

  // Zbog brzine promene, refetchujemo na svaki fokus i često proveravamo (real-time doživljaj)
  const { data, isLoading } = useGetNotificationsQuery({ limit: visibleCount }, {
    refetchOnFocus: true,
    pollingInterval: 3000 // Proveravaj na svake 3 sekunde za real-time notifikacije
  });

  const notifications = data?.notifications || [];
  const total = data?.total || 0;
  const hasMore = notifications.length < total;

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const prevUnreadCountRef = useRef(unreadCount);

  useEffect(() => {
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  // Zatvaranje na klik izvan dropdowna
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Da ne zatvori dropdown ako slučajno okine
    try {
      await markAsRead(id).unwrap();
    } catch (error) {
      console.error('Greška pri označavanju notifikacije', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      // Ne zatvaramo panel ovde da bi korisnik mogao da pročita šta piše
    } catch (error) {
      console.error('Greška pri označavanju svih notifikacija', error);
    }
  };

  // Automatski označi sve kao pročitano kada se panel otvori
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      handleMarkAllAsRead();
    }
  }, [isOpen, unreadCount]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary text-slate-300 hover:text-white"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-semibold text-white">Obaveštenja</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-emerald-400 font-medium flex items-center transition-colors"
              >
                <Check className="w-3 h-3 mr-1" /> Označi sve
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Trenutno nemate obaveštenja.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {notifications.map((notification: any) => (
                  <div
                    key={notification._id}
                    onClick={(e) => {
                      if (!notification.isRead) {
                        handleMarkAsRead(e, notification._id);
                      }
                    }}
                    className={cn(
                      "p-4 transition-colors relative group",
                      !notification.isRead 
                        ? "bg-primary/5 hover:bg-primary/10 cursor-pointer" 
                        : "hover:bg-slate-800/50"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={cn(
                          "text-sm font-medium mb-1",
                          !notification.isRead ? "text-white" : "text-slate-300"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {format(new Date(notification.createdAt), 'dd. MMMM yyyy. HH:mm', { locale: srLatn })}
                        </p>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Klikni da označiš kao pročitano"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                  </div>
                ))}
                
                {hasMore && (
                  <div className="p-3 text-center border-t border-slate-800/50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setVisibleCount(prev => prev + 5);
                      }}
                      className="text-xs font-medium text-primary hover:text-emerald-400 transition-colors py-2 px-4 rounded-lg hover:bg-primary/10 w-full"
                    >
                      Učitaj još obaveštenja
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
