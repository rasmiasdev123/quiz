import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ClipboardList, Clock, HelpCircle } from 'lucide-react';
import { Button, Card, Input, Modal, Spinner } from '../../components/ui';
import NativeSelect from '../../components/ui/NativeSelect';
import { ROUTES } from '../../utils/constants';
import { getQuizzes, deleteQuiz, updateQuiz, parseTopicConfigs } from '../../services/quizService';
import { getAdminQuizzesData } from '../../services/adminQuizzesService';
import { useUIStore } from '../../stores';
import { formatDate, formatDuration } from '../../utils/formatters';

function Quizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, quiz: null });
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  useEffect(() => {
    loadData();
  }, [selectedBook]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Single optimized call to get both quizzes and books in parallel
      const { quizzes: quizzesList, books: booksList } = await getAdminQuizzesData({
        bookId: selectedBook || undefined,
        limit: 100,
      });
      setQuizzes(quizzesList);
      setBooks(booksList);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.quiz) return;
    try {
      await deleteQuiz(deleteModal.quiz.$id);
      showSuccess('Quiz deleted successfully');
      setDeleteModal({ open: false, quiz: null });
      loadData();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      showError('Failed to delete quiz');
    }
  };


  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-600 mt-1">Create and manage quizzes</p>
        </div>
        <Link to={`${ROUTES.ADMIN.QUIZZES}/new`}>
          <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
            Create New Quiz
          </Button>
        </Link>
      </div>

      <Card className="p-4">
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

      {filteredQuizzes.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedBook ? 'Try adjusting your filters' : 'Get started by creating your first quiz'}
          </p>
          {!searchTerm && !selectedBook && (
            <Link to={`${ROUTES.ADMIN.QUIZZES}/new`}>
              <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
                Create First Quiz
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz, index) => {
            // Cycle through different accent colors for visual variety
            const accentColors = [
              { bg: 'bg-indigo-50', icon: 'bg-indigo-500', border: 'border-indigo-200', text: 'text-indigo-700' },
              { bg: 'bg-purple-50', icon: 'bg-purple-500', border: 'border-purple-200', text: 'text-purple-700' },
              { bg: 'bg-pink-50', icon: 'bg-pink-500', border: 'border-pink-200', text: 'text-pink-700' },
              { bg: 'bg-blue-50', icon: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-700' },
              { bg: 'bg-emerald-50', icon: 'bg-emerald-500', border: 'border-emerald-200', text: 'text-emerald-700' },
              { bg: 'bg-amber-50', icon: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700' },
            ];
            const colorScheme = accentColors[index % accentColors.length];
            
            // Get question count from stored total_questions field
            const questionCount = quiz.total_questions || 0;
            const questionDisplay = questionCount > 0 ? questionCount : '0';
            
            return (
              <Card 
                key={quiz.$id} 
                variant="elevated" 
                hover 
                className="p-0 overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-300 group"
              >
                {/* Header Section with Icon */}
                <div className={`${colorScheme.bg} p-3 border-b ${colorScheme.border} relative overflow-hidden`}>
                  {/* Decorative Pattern */}
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                    <div className="absolute top-2 right-2 w-16 h-16 border-2 border-gray-400 rounded-full"></div>
                    <div className="absolute top-4 right-4 w-10 h-10 border-2 border-gray-400 rounded-full"></div>
                  </div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className={`${colorScheme.icon} w-10 h-10 rounded-xl flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
                      <ClipboardList className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.ADMIN.QUIZZES}/${quiz.$id}/edit`);
                        }}
                        className="p-1.5 bg-white/80 backdrop-blur-sm hover:bg-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Edit className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ open: true, quiz });
                        }}
                        className="p-1.5 bg-white/80 backdrop-blur-sm hover:bg-red-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-3">
                  <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-gray-700 transition-colors mb-1.5">
                    {quiz.title}
                  </h3>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2 leading-relaxed min-h-[2rem]">
                    {quiz.description || 'No description provided'}
                  </p>
                  
                  {/* Question Number and Duration */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-500">Questions:</span>
                      <span className="font-semibold text-gray-900">{questionDisplay}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-semibold text-gray-900">{formatDuration(quiz.duration_minutes, 'minutes')}</span>
                    </div>
                  </div>
                  
                  {/* Footer with Date and Status */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                      <span className="text-[10px]">{formatDate(quiz.$createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {quiz.is_published ? (
                        <div className="text-[10px] font-medium px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                          Published
                        </div>
                      ) : (
                        <div className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          Draft
                        </div>
                      )}
                      <div className={`${colorScheme.text} text-[10px] font-medium px-2 py-0.5 rounded ${colorScheme.bg} border ${colorScheme.border}`}>
                        Quiz
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover Effect Indicator */}
                <div className={`h-0.5 ${colorScheme.icon} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, quiz: null })}
        title="Delete Quiz"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteModal.quiz?.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, quiz: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Quizzes;

