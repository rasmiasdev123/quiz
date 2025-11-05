import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Trophy, TrendingUp, Award, ArrowRight, Clock } from 'lucide-react';
import { Card, Spinner } from '../../components/ui';
import { ROUTES } from '../../utils/constants';
import { getStudentDashboardData } from '../../services/studentDashboardService';
import { useAuthStore } from '../../stores';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../lib/utils';

function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    availableQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalPoints: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState([]);

  const loadDashboardData = useCallback(async () => {
    if (!user?.$id) return;
    
    try {
      setLoading(true);
      
      // Single optimized call to get all dashboard data
      const { stats: dashboardStats, recentAttempts: attempts } = await getStudentDashboardData(user.$id);
      
      setStats(dashboardStats);
      setRecentAttempts(attempts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.$id) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, loadDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      icon: BookOpen,
      label: 'Available',
      value: stats.availableQuizzes,
      color: 'bg-blue-500',
      route: ROUTES.STUDENT.QUIZZES,
    },
    {
      icon: Trophy,
      label: 'Completed',
      value: stats.completedQuizzes,
      color: 'bg-green-500',
      route: ROUTES.STUDENT.HISTORY,
    },
    {
      icon: TrendingUp,
      label: 'Avg Score',
      value: stats.averageScore > 0 ? `${stats.averageScore}%` : '-',
      color: 'bg-purple-500',
    },
    {
      icon: Award,
      label: 'Points',
      value: stats.totalPoints,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid - Compact Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isClickable = stat.route;
          
          const CardContent = (
            <Card 
              className={cn(
                "p-4 transition-all duration-200 border border-gray-200",
                isClickable && "hover:shadow-md cursor-pointer"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  stat.color
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 mb-0.5">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 truncate">
                    {stat.value}
                  </p>
                </div>
                {isClickable && (
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
            </Card>
          );

          return isClickable ? (
            <Link key={index} to={stat.route}>
              {CardContent}
            </Link>
          ) : (
            <div key={index}>{CardContent}</div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quiz History */}
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Quiz History
            </h2>
            <Link
              to={ROUTES.STUDENT.HISTORY}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          {recentAttempts.length === 0 ? (
            <div className="text-center py-6">
              <Trophy className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No attempts yet</h3>
              <p className="text-xs text-gray-600">Start your first quiz!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAttempts.map((attempt) => {
                const percentage = attempt.percentage || 0;
                
                const getScoreColor = (perc) => {
                  if (perc >= 80) return 'bg-green-500';
                  if (perc >= 60) return 'bg-blue-500';
                  if (perc >= 40) return 'bg-orange-500';
                  return 'bg-red-500';
                };

                return (
                  <div
                    key={attempt.$id}
                    className="p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => navigate(`${ROUTES.STUDENT.QUIZZES}/${attempt.quiz_id}/results?attempt=${attempt.$id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate mb-0.5">
                          {attempt.quiz_title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{formatDate(attempt.completed_at || attempt.$updatedAt)}</span>
                          <span>•</span>
                          <span>{attempt.points_earned || 0}/{attempt.total_points || 0} pts</span>
                        </div>
                      </div>
                      <div className={cn(
                        "px-2.5 py-1 rounded-lg text-white font-semibold text-xs ml-2",
                        getScoreColor(percentage)
                      )}>
                        {percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick Access */}
        <Card className="p-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-gray-600" />
            Quick Access
          </h2>
          <div className="space-y-2">
            <Link
              to={ROUTES.STUDENT.QUIZZES}
              className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Browse Quizzes</p>
                  <p className="text-xs text-gray-600">Start a new quiz</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
            <Link
              to={ROUTES.STUDENT.HISTORY}
              className="block p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">View History</p>
                  <p className="text-xs text-gray-600">See all attempts</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default StudentDashboard;
