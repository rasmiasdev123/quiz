import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, HelpCircle, Award, Play, BookOpen, Filter } from 'lucide-react';
import { Card, Input, Button, Spinner } from '../../components/ui';
import NativeSelect from '../../components/ui/NativeSelect';
import { ROUTES } from '../../utils/constants';
import { getStudentQuizzesData } from '../../services/studentQuizzesService';
import { parseTopicConfigs } from '../../services/quizService';
import { useUIStore } from '../../stores';
import { formatDuration } from '../../utils/formatters';
import { cn } from '../../lib/utils';

function Quizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const showError = useUIStore((state) => state.showError);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Single optimized call to get both quizzes and books
      const { quizzes: quizzesList, books: booksList } = await getStudentQuizzesData({
        bookId: selectedBook || undefined,
        limit: 50,
      });
      setQuizzes(quizzesList);
      setBooks(booksList);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, [selectedBook, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartQuiz = (quizId) => {
    navigate(`${ROUTES.STUDENT.QUIZZES}/${quizId}/take`);
  };

  // Client-side search filter
  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4 border-2 border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <NativeSelect
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            containerClassName="w-full sm:w-64"
          >
            <option value="">All Books</option>
            {books.map((book) => (
              <option key={book.$id} value={book.$id}>
                {book.title}
              </option>
            ))}
          </NativeSelect>
        </div>
      </Card>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <Card className="p-12 text-center border-2 border-gray-200">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedBook ? 'Try adjusting your filters' : 'No published quizzes available yet'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz, index) => {
            const accentColors = [
              { gradient: 'from-blue-500 via-blue-600 to-cyan-500', light: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', icon: 'bg-blue-100' },
              { gradient: 'from-purple-500 via-purple-600 to-pink-500', light: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', icon: 'bg-purple-100' },
              { gradient: 'from-emerald-500 via-emerald-600 to-teal-500', light: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', icon: 'bg-emerald-100' },
              { gradient: 'from-amber-500 via-amber-600 to-orange-500', light: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', icon: 'bg-amber-100' },
              { gradient: 'from-rose-500 via-rose-600 to-pink-500', light: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', icon: 'bg-rose-100' },
              { gradient: 'from-indigo-500 via-indigo-600 to-blue-500', light: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', icon: 'bg-indigo-100' },
            ];
            const colorScheme = accentColors[index % accentColors.length];
            
            const topicConfigs = parseTopicConfigs(quiz.topic_configs || []);
            const questionCount = quiz.total_questions || 0;
            
            return (
              <Card 
                key={quiz.$id} 
                className={cn(
                  "group relative overflow-hidden bg-white border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5",
                  colorScheme.border
                )}
              >
                {/* Gradient accent bar */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                  colorScheme.gradient
                )}></div>

                {/* Decorative corner */}
                <div className={cn(
                  "absolute top-0 right-0 w-20 h-20 opacity-10 bg-gradient-to-bl rounded-bl-full",
                  colorScheme.gradient
                )}></div>

                <div className="p-4 relative">
                  {/* Header */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-gray-800 transition-colors leading-tight">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {quiz.description}
                      </p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 shadow-sm", colorScheme.icon)}>
                        <HelpCircle className={cn("w-4 h-4", colorScheme.text)} />
                      </div>
                      <span className="text-xs font-medium text-gray-500 mb-0.5">Questions</span>
                      <span className={cn("text-sm font-bold", colorScheme.text)}>
                        {questionCount}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 shadow-sm", colorScheme.icon)}>
                        <Clock className={cn("w-4 h-4", colorScheme.text)} />
                      </div>
                      <span className="text-xs font-medium text-gray-500 mb-0.5">Duration</span>
                      <span className={cn("text-sm font-bold", colorScheme.text)}>
                        {formatDuration(quiz.duration_minutes, 'minutes')}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 shadow-sm", colorScheme.icon)}>
                        <Award className={cn("w-4 h-4", colorScheme.text)} />
                      </div>
                      <span className="text-xs font-medium text-gray-500 mb-0.5">Points</span>
                      <span className={cn("text-sm font-bold", colorScheme.text)}>
                        {quiz.total_points || 0}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleStartQuiz(quiz.$id)}
                    className={cn(
                      "w-full bg-gradient-to-r text-white font-semibold hover:shadow-xl transition-all duration-200 hover:scale-[1.02] rounded-lg text-sm py-2",
                      colorScheme.gradient
                    )}
                    leftIcon={<Play className="w-4 h-4" />}
                  >
                    Start Quiz
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Quizzes;
