import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Button, Card, Input, Badge, Modal, Spinner, Table } from '../../components/ui';
import NativeSelect from '../../components/ui/NativeSelect';
import { ROUTES } from '../../utils/constants';
import { getQuestions, deleteQuestion, parseOptions } from '../../services/questionService';
import { getAdminQuestionsData, getAdminQuestionsFilters } from '../../services/adminQuestionsService';
import { useUIStore } from '../../stores';
import { formatDate } from '../../utils/formatters';
import { QUESTION_TYPES, DIFFICULTY_LEVELS } from '../../utils/constants';
import { cn } from '../../lib/utils';

function Questions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [books, setBooks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, question: null });
  const [expandedOptions, setExpandedOptions] = useState(new Set());
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef(null);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  const QUESTIONS_PER_PAGE = 15;

  const loadFilters = async () => {
    try {
      // Single optimized call to get both books and topics in parallel
      const { books: booksList, topics: topicsList } = await getAdminQuestionsFilters(selectedBook || undefined);
      setBooks(booksList);
      setTopics(topicsList);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const loadQuestions = useCallback(async (currentOffset = 0, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Use optimized service
      const { questions: newQuestions, total } = await getAdminQuestionsData({
        bookId: selectedBook || undefined,
        topicId: selectedTopic || undefined,
        limit: QUESTIONS_PER_PAGE,
        offset: currentOffset,
        searchTerm: searchTerm || undefined,
      });
      
      if (isInitial) {
        setQuestions(newQuestions);
      } else {
        setQuestions((prev) => [...prev, ...newQuestions]);
      }
      
      // Check if there are more questions to load
      const newOffset = currentOffset + QUESTIONS_PER_PAGE;
      setHasMore(newOffset < total);
      setOffset(newOffset);
    } catch (error) {
      console.error('Error loading questions:', error);
      showError('Failed to load questions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedBook, selectedTopic, searchTerm, showError]);

  // Load filters (books and topics) when book changes or on mount
  useEffect(() => {
    loadFilters();
  }, [selectedBook]);

  // Reset and load questions when filters or search change
  useEffect(() => {
    setOffset(0);
    setQuestions([]);
    setHasMore(true);
    loadQuestions(0, true);
  }, [selectedBook, selectedTopic, searchTerm, loadQuestions]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadQuestions(offset, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, offset, loadQuestions]);

  const handleDelete = async () => {
    if (!deleteModal.question) return;
    try {
      await deleteQuestion(deleteModal.question.$id);
      showSuccess('Question deleted successfully');
      setDeleteModal({ open: false, question: null });
      // Remove deleted question from list
      setQuestions((prev) => prev.filter((q) => q.$id !== deleteModal.question.$id));
    } catch (error) {
      console.error('Error deleting question:', error);
      showError('Failed to delete question');
    }
  };

  // Client-side search filter (since fulltext index may not be available)
  // If searchTerm is provided, filter questions on client side
  const filteredQuestions = searchTerm && searchTerm.trim()
    ? questions.filter((q) =>
        q.question_text?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : questions;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'default';
    }
  };


  const getParsedOptions = (question) => {
    if (!question.options) return [];
    return parseOptions(question.options);
  };

  const toggleOptionsExpansion = (questionId) => {
    setExpandedOptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600 mt-1">Manage quiz questions</p>
        </div>
        <Link to={`${ROUTES.ADMIN.QUESTIONS}/new`}>
          <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
            Add New Question
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <NativeSelect
            value={selectedBook}
            onChange={(e) => {
              const newBookId = e.target.value;
              setSelectedBook(newBookId);
              setSelectedTopic(''); // Reset topic when book changes
            }}
            containerClassName="w-full sm:w-64"
          >
            <option value="">All Books</option>
            {books.map((book) => (
              <option key={book.$id} value={book.$id}>
                {book.title}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
            }}
            containerClassName="w-full sm:w-64"
            disabled={!selectedBook}
          >
            <option value="">All Topics</option>
            {topics.map((topic) => (
              <option key={topic.$id} value={topic.$id}>
                {topic.title}
              </option>
            ))}
          </NativeSelect>
        </div>
      </Card>

      {loading && questions.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card className="p-12 text-center">
          <HelpCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedBook || selectedTopic ? 'Try adjusting your filters' : 'Get started by creating your first question'}
          </p>
          {!searchTerm && !selectedBook && !selectedTopic && (
            <Link to={`${ROUTES.ADMIN.QUESTIONS}/new`}>
              <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
                Create First Question
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[35%]">Question</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[30%]">Options</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">Difficulty</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">Points</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredQuestions.map((question) => {
                    const options = getParsedOptions(question);
                    const isOptionsExpanded = expandedOptions.has(question.$id);
                    
                    return (
                      <tr 
                        key={question.$id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 align-top">
                          <div>
                            <p className="text-sm text-gray-900 leading-relaxed mb-2">
                              {question.question_text}
                            </p>
                            {question.explanation && (
                              <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-500 mb-1">Explanation:</p>
                                <p className="text-xs text-gray-600 italic">{question.explanation}</p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap items-start gap-2">
                            {isOptionsExpanded ? (
                              // Show all options when expanded (full text, no truncation)
                              <>
                                {options.map((option, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "text-sm px-4 py-2 rounded-full border flex items-start gap-2",
                                      "transition-all",
                                      option.isCorrect
                                        ? "bg-green-100 text-green-700 border-green-300 font-medium"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                    )}
                                  >
                                    <span className="text-xs whitespace-normal break-words flex-1 min-w-0">{option.text || '(empty)'}</span>
                                    {option.isCorrect && (
                                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600 mt-0.5" />
                                    )}
                                  </div>
                                ))}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOptionsExpansion(question.$id);
                                  }}
                                  className="text-xs px-4 py-2 rounded-full border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors font-medium flex-shrink-0"
                                  title="Collapse options"
                                >
                                  −
                                </button>
                              </>
                            ) : (
                              // Show only correct answer + "+X" button when collapsed (with truncation if long)
                              <>
                                {options.map((option, idx) => {
                                  if (option.isCorrect) {
                                    return (
                                      <div
                                        key={idx}
                                        className="text-sm px-4 py-2 rounded-full border bg-green-100 text-green-700 border-green-300 font-medium flex items-center gap-2"
                                      >
                                        <span className="text-xs truncate max-w-[200px]">{option.text || '(empty)'}</span>
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" />
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                                {options.filter(opt => !opt.isCorrect).length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleOptionsExpansion(question.$id);
                                    }}
                                    className="text-xs px-4 py-2 rounded-full border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors font-medium"
                                    title="View all options"
                                  >
                                    +{options.filter(opt => !opt.isCorrect).length}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge variant="default" className="text-xs">
                            {question.question_type === 'multiple_choice' ? 'MCQ' : 'T/F'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge variant={getDifficultyColor(question.difficulty)} className="text-xs capitalize">
                            {question.difficulty}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="text-sm font-medium text-gray-700">
                            {question.points || 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`${ROUTES.ADMIN.QUESTIONS}/${question.$id}/edit`)}
                              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ open: true, question })}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          
          {/* Infinite scroll trigger */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-gray-500">
                <Spinner size="sm" />
                <span className="text-sm">Loading more questions...</span>
              </div>
            )}
            {!hasMore && questions.length > 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No more questions to load
              </p>
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, question: null })}
        title="Delete Question"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this question? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, question: null })}>
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

export default Questions;

