import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  HelpCircle,
  FileQuestion,
  ClipboardList,
  Upload,
  Users,
  LogOut,
  Menu,
  X,
  Lock,
} from 'lucide-react';
import { ROUTES } from '../../utils/constants';
import { useAuthStore } from '../../stores';
import { cn } from '../../lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.ADMIN.DASHBOARD },
  { icon: BookOpen, label: 'Books', path: ROUTES.ADMIN.BOOKS },
  { icon: FolderTree, label: 'Topics', path: ROUTES.ADMIN.TOPICS },
  { icon: HelpCircle, label: 'Questions', path: ROUTES.ADMIN.QUESTIONS },
  { icon: Upload, label: 'Bulk Import', path: ROUTES.ADMIN.BULK_IMPORT },
  { icon: ClipboardList, label: 'Quizzes', path: ROUTES.ADMIN.QUIZZES },
  { icon: FileQuestion, label: 'Attempts', path: ROUTES.ADMIN.ATTEMPTS },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Lock, label: 'Change Password', path: ROUTES.ADMIN.CHANGE_PASSWORD },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.HOME, { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate anyway even if logout fails
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Quiz App</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive && 'text-white')} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

