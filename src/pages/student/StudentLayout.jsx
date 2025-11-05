import { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { ROUTES } from '../../utils/constants';
import { LayoutDashboard, LogOut, Menu, X, BookOpen, History, Sparkles, User, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: ROUTES.STUDENT.DASHBOARD,
    color: 'from-blue-500 to-cyan-500',
    hoverColor: 'hover:from-blue-600 hover:to-cyan-600',
  },
  { 
    icon: BookOpen, 
    label: 'Available Quizzes', 
    path: ROUTES.STUDENT.QUIZZES,
    color: 'from-purple-500 to-pink-500',
    hoverColor: 'hover:from-purple-600 hover:to-pink-600',
  },
  { 
    icon: History, 
    label: 'Attempt History', 
    path: ROUTES.STUDENT.HISTORY,
    color: 'from-emerald-500 to-teal-500',
    hoverColor: 'hover:from-emerald-600 hover:to-teal-600',
  },
  { 
    icon: Lock, 
    label: 'Change Password', 
    path: ROUTES.STUDENT.CHANGE_PASSWORD,
    color: 'from-amber-500 to-orange-500',
    hoverColor: 'hover:from-amber-600 hover:to-orange-600',
  },
];

function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, userProfile, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.HOME, { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out',
          'bg-gradient-to-b from-purple-600 via-blue-600 to-cyan-600 shadow-2xl',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Quiz App</h1>
                <p className="text-xs text-white/80 font-medium">Student Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    'relative overflow-hidden',
                    isActive
                      ? 'bg-white/20 backdrop-blur-sm shadow-lg border border-white/30'
                      : 'hover:bg-white/10 hover:backdrop-blur-sm'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                  )}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                    isActive
                      ? `bg-gradient-to-br ${item.color} shadow-md`
                      : `bg-white/10 group-hover:bg-gradient-to-br group-hover:${item.color}`
                  )}>
                    <Icon className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                    )} />
                  </div>
                  <span className={cn(
                    'font-semibold transition-colors',
                    isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-white/20 space-y-3">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {userProfile?.name || user?.name || 'Student'}
                  </p>
                  <p className="text-xs text-white/80 truncate">
                    {userProfile?.email || user?.email}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm border border-red-400/30 text-white transition-all duration-200 font-semibold group"
            >
              <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full border border-purple-200/50">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {userProfile?.name || user?.name || 'Student'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {userProfile?.email || user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
