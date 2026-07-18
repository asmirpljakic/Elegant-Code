import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import React, { useState, useEffect } from 'react';
import type { RootState } from '../../store/store';
import { logout } from '../../store/authSlice';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  LogOut, 
  Code2, 
  Settings, 
  BarChart, 
  Award, 
  Video, 
  CalendarClock,
  Megaphone,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { NotificationDropdown } from '../ui/NotificationDropdown';

export default function MainLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Zatvaranje menija pri promeni rute na mobilnom
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Raspored', path: '/dashboard/schedule', icon: Calendar },
    { 
      name: 'Nadoknade', 
      path: '/dashboard/makeup-schedule', 
      icon: CalendarClock,
      hidden: !['SUPER_ADMIN', 'ADMIN', 'PROFESOR'].includes(user?.role || '') 
    },
    { 
      name: 'Korisnici', 
      path: '/dashboard/users', 
      icon: Users,
      // Sakrij od učenika i klijenata
      hidden: !['SUPER_ADMIN', 'ADMIN', 'PROFESOR'].includes(user?.role || '') 
    },
    { 
      name: 'Google Meet', 
      path: '/dashboard/google-meet', 
      icon: Video,
      hidden: !['SUPER_ADMIN', 'ADMIN', 'PROFESOR'].includes(user?.role || '') 
    },
    { 
      name: 'Moji Sertifikati', 
      path: '/dashboard/certificates', 
      icon: Award,
      hidden: !['UCENIK', 'KLIJENT'].includes(user?.role || '') 
    },
    { 
      name: 'Statistika',  
      path: '/dashboard/analytics', 
      icon: BarChart,
      hidden: !['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') 
    },
    { 
      name: 'Baneri', 
      path: '/dashboard/banners', 
      icon: Megaphone,
      hidden: !['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') 
    },
    { 
      name: 'Podešavanja', 
      path: '/dashboard/settings', 
      icon: Settings,
      hidden: !['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-900 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex flex-shrink-0 items-center px-6 border-b border-slate-800 justify-between md:justify-start">
          <div className="flex items-center">
            <Code2 className="w-6 h-6 text-primary mr-2" />
            <span className="text-lg font-bold text-white tracking-tight">Elegant Code</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.filter(item => !item.hidden).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold mr-3">
              {user?.firstName?.charAt(0) || user?.role?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Odjavi se
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-950 h-screen">
        
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between md:justify-end px-4 md:px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md relative z-[100]">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <NotificationDropdown />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
