import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Clock, Trophy, Target, Eye, TrendingUp, Award } from 'lucide-react';
import { Card, Input, Button, Spinner } from '../../components/ui';
import NativeSelect from '../../components/ui/NativeSelect';
import { ROUTES } from '../../utils/constants';
import { getStudentHistoryData } from '../../services/studentHistoryService';
import { useAuthStore } from '../../stores';
import { useUIStore } from '../../stores';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../lib/utils';

function History() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const showError = useUIStore((state) => state.showError);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    bestScore: 0,
    totalPoints: 0,
  });

  const observerTarget = useRef(null);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async (resetOffset = false) => {
    if (!user?.$id || isLoadingRef.current) return;
    
    try {
      if (resetOffset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      isLoadingRef.current = true;
      const currentOffset = resetOffset ? 0 : offset;
      
      const data = await getStudentHistoryData(user.$id, {
        quizId: selectedQuiz || undefined,
        limit: 15,
        offset: currentOffset,
        searchTerm: searchTerm || undefined,
      });

      if (resetOffset) {
        setAttempts(data.attempts);
        setQuizzes(data.quizzes);
        setStats(data.stats);
      } else {
        setAttempts(prev => [...prev, ...data.attempts]);
      }
      
      setHasMore(data.hasMore);
      setOffset(currentOffset + data.attempts.length);
    } catch (error) {
      console.error('Error loading history data:', error);
      showError('Failed to load attempt history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [user, selectedQuiz, searchTerm, offset, showError]);

  // Load initial data
  useEffect(() => {
    if (user?.$id) {
      loadData(true);
    }
  }, [user, selectedQuiz]); // Reset when quiz filter changes

  // Load more when search term changes (debounced)
  useEffect(() => {
    if (!user?.$id) return;
    
    const timeoutId = setTimeout(() => {
      loadData(true);
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // Only searchTerm for debounced search

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!observerTarget.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current) {
          loadData(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loadData]);

  useEffect(() => {
    const attemptId = searchParams.get('attempt');
    if (attemptId && attempts.length > 0) {
      const attempt = attempts.find(a => a.$id === attemptId);
      if (attempt) {
        navigate(`${ROUTES.STUDENT.QUIZZES}/${attempt.quiz_id}/results?attempt=${attemptId}`);
      }
    }
  }, [searchParams, attempts, navigate]);

  const handleViewResults = (attempt) => {
    navigate(`${ROUTES.STUDENT.QUIZZES}/${attempt.quiz_id}/results?attempt=${attempt.$id}`);
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return { gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (percentage >= 60) return { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    if (percentage >= 40) return { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    return { gradient: 'from-red-500 to-pink-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Attempts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-gray-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Best Score</p>
              <p className="text-3xl font-bold text-gray-900">{stats.bestScore}%</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Points</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPoints}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-2 border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search attempts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <NativeSelect
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            containerClassName="w-full sm:w-64"
          >
            <option value="">All Quizzes</option>
            {quizzes.map((quiz) => (
              <option key={quiz.$id} value={quiz.$id}>
                {quiz.title}
              </option>
            ))}
          </NativeSelect>
        </div>
      </Card>

      {/* Attempts List */}
      {attempts.length === 0 ? (
        <Card className="p-12 text-center border-2 border-gray-200">
          <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No attempts found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedQuiz ? 'Try adjusting your filters' : 'You haven\'t completed any quizzes yet'}
          </p>
          {!searchTerm && !selectedQuiz && (
            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.STUDENT.QUIZZES)}
              leftIcon={<Trophy className="w-5 h-5" />}
            >
              Browse Quizzes
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* Table Style */}
          <Card className="overflow-hidden border-2 border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quiz</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Score</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Points</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attempts.map((attempt) => {
                    const percentage = Number(attempt.percentage) || 0;
                    const scoreColor = getScoreColor(percentage);
                    // Find quiz name from quizzes array
                    const quiz = quizzes.find(q => q.$id === attempt.quiz_id);
                    const quizName = quiz?.title || attempt.quiz_title || 'Quiz';

                    return (
                      <tr
                        key={attempt.$id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => handleViewResults(attempt)}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                            {quizName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {formatDate(attempt.completed_at || attempt.$updatedAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className={cn(
                            "inline-flex px-3 py-1.5 rounded-lg text-white font-bold text-sm shadow-sm bg-gradient-to-br",
                            scoreColor.gradient
                          )}>
                            {percentage}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-medium text-gray-700">
                            <span className="font-bold text-gray-900">{attempt.points_earned || 0}</span>
                            <span className="text-gray-500"> / {attempt.total_points || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm text-gray-600">
                            {attempt.duration_minutes ? `${attempt.duration_minutes} min` : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewResults(attempt);
                            }}
                            className="rounded-lg"
                            leftIcon={<Eye className="w-4 h-4" />}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={observerTarget} className="flex justify-center py-8">
              {loadingMore && <Spinner size="md" />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default History;
