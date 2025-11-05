import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FolderTree,
  HelpCircle,
  ClipboardList,
  Users,
  TrendingUp,
  Clock,
  Award,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { Card } from '../../components/ui';
import { ROUTES } from '../../utils/constants';
import { getDashboardStats, getRecentActivity } from '../../services/dashboardService';
import { formatDate } from '../../utils/formatters';

function AdminDashboard() {
  const [stats, setStats] = useState({
    books: 0,
    topics: 0,
    questions: 0,
    quizzes: 0,
    attempts: 0,
    users: 0,
    loading: true,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch dashboard stats (counts only - optimized) and recent activity in parallel
      const [statsData, activity] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(),
      ]);

      setStats({
        ...statsData,
        loading: false,
      });

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const statCards = [
    {
      title: 'Books',
      value: stats.books,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      link: ROUTES.ADMIN.BOOKS,
    },
    {
      title: 'Topics',
      value: stats.topics,
      icon: FolderTree,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      link: ROUTES.ADMIN.TOPICS,
    },
    {
      title: 'Questions',
      value: stats.questions,
      icon: HelpCircle,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      link: ROUTES.ADMIN.QUESTIONS,
    },
    {
      title: 'Quizzes',
      value: stats.quizzes,
      icon: ClipboardList,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      link: ROUTES.ADMIN.QUIZZES,
    },
    {
      title: 'Attempts',
      value: stats.attempts,
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      link: ROUTES.ADMIN.ATTEMPTS,
    },
    {
      title: 'Users',
      value: stats.users,
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      link: '/admin/users',
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your quiz app.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.link}>
              <Card variant="elevated" hover className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.loading ? '...' : stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-indigo-600 font-medium">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Quick Actions */}
        <Card variant="elevated" className="p-6 w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to={`${ROUTES.ADMIN.BOOKS}/new`}
              className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors w-full min-w-0"
            >
              <BookOpen className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span className="font-medium text-gray-900 truncate">Create New Book</span>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
            </Link>
            <Link
              to={`${ROUTES.ADMIN.QUESTIONS}/new`}
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors w-full min-w-0"
            >
              <HelpCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <span className="font-medium text-gray-900 truncate">Add Question</span>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
            </Link>
            <Link
              to={`${ROUTES.ADMIN.QUIZZES}/new`}
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors w-full min-w-0"
            >
              <ClipboardList className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="font-medium text-gray-900 truncate">Create Quiz</span>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
            </Link>
            <Link
              to={ROUTES.ADMIN.BULK_IMPORT}
              className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors w-full min-w-0"
            >
              <TrendingUp className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <span className="font-medium text-gray-900 truncate">Bulk Import Questions</span>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
            </Link>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card variant="elevated" className="p-6 w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(activity.time)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;

