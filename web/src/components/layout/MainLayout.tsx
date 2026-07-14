import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { logout } from '../../store/authSlice';
import { LayoutDashboard, Calendar, Users, LogOut, Code2, Settings, BarChart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NotificationDropdown } from '../ui/NotificationDropdown';

export default function MainLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Raspored', path: '/dashboard/schedule', icon: Calendar },
    { 
      name: 'Korisnici', 
      path: '/dashboard/users', 
      icon: Users,
      // Sakrij od učenika i klijenata
      hidden: !['SUPER_ADMIN', 'ADMIN', 'PROFESOR'].includes(user?.role || '') 
    },
    { 
      name: 'Statistika', 
      path: '/dashboard/analytics', 
      icon: BarChart,
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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Code2 className="w-6 h-6 text-primary mr-2" />
          <span className="text-lg font-bold text-white tracking-tight">Elegant Code</span>
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-950">
        
        {/* Top Header - Novi Top Bar za notifikacije */}
        <header className="h-16 flex-shrink-0 flex items-center justify-end px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-[100]">
          <NotificationDropdown />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
