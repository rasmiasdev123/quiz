import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, BookOpen, Tag, HelpCircle, Award, AlertCircle, Plus, Trash2, Shuffle, CheckSquare } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { quizSchema } from '../../utils/validators';
import { createQuiz, updateQuiz, getQuiz, parseTopicConfigs } from '../../services/quizService';
import { getBooksForDropdown } from '../../services/bookService';
import { getTopics } from '../../services/topicService';
import { getQuestions } from '../../services/questionService';
import { useUIStore } from '../../stores';
import { useAuthStore } from '../../stores';
import { ROUTES } from '../../utils/constants';
import { cn } from '../../lib/utils';

function QuizForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [books, setBooks] = useState([]);
  const [allTopics, setAllTopics] = useState([]); // All topics from selected books
  const [topicQuestionCounts, setTopicQuestionCounts] = useState({}); // {topicId: count}
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [topicConfigs, setTopicConfigs] = useState([]); // [{topic_id, selection_type, random_count?}]
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      is_published: false,
      book_ids: [],
      topic_configs: [],
    },
  });

  useEffect(() => {
    loadBooks();
    if (isEdit) {
      loadQuiz();
    }
  }, [id]);

  useEffect(() => {
    if (selectedBookIds.length > 0) {
      loadTopicsForSelectedBooks();
    } else {
      setAllTopics([]);
      setTopicConfigs([]);
    }
  }, [selectedBookIds]);

  useEffect(() => {
    // Load question counts for all topics
    if (allTopics.length > 0) {
      loadQuestionCounts();
    }
  }, [allTopics]);

  const loadBooks = async () => {
    try {
      const booksList = await getBooksForDropdown();
      setBooks(booksList);
    } catch (error) {
      console.error('Error loading books:', error);
      showError('Failed to load books');
    }
  };

  const loadTopicsForSelectedBooks = async () => {
    try {
      const allTopicsList = [];
      for (const bookId of selectedBookIds) {
        const response = await getTopics({ bookId });
        const topics = response?.documents || [];
        allTopicsList.push(...topics);
      }
      setAllTopics(allTopicsList);
    } catch (error) {
      console.error('Error loading topics:', error);
      showError('Failed to load topics');
    }
  };

  const loadQuestionCounts = async () => {
    try {
      const { getQuestionsByTopic } = await import('../../services/questionService');
      const counts = {};
      for (const topic of allTopics) {
        try {
          // Use getQuestionsByTopic to get ALL questions (no limit)
          const response = await getQuestionsByTopic(topic.$id);
          counts[topic.$id] = response?.documents?.length || response?.total || 0;
        } catch (error) {
          console.error(`Error loading questions for topic ${topic.$id}:`, error);
          counts[topic.$id] = 0;
        }
      }
      setTopicQuestionCounts(counts);
    } catch (error) {
      console.error('Error loading question counts:', error);
    }
  };

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const quiz = await getQuiz(id);
      if (quiz) {
        // Parse topic_configs from JSON strings
        const parsedTopicConfigs = parseTopicConfigs(quiz.topic_configs || []);
        
        // Get book_ids (handle both old single book_id and new book_ids array)
        const bookIds = quiz.book_ids || (quiz.book_id ? [quiz.book_id] : []);
        
        reset({
          title: quiz.title,
          description: quiz.description || '',
          book_ids: bookIds,
          topic_configs: parsedTopicConfigs,
          duration_minutes: quiz.duration_minutes,
          is_published: quiz.is_published || false,
        });
        
        setSelectedBookIds(bookIds);
        setTopicConfigs(parsedTopicConfigs);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      showError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleBookToggle = (bookId) => {
    setSelectedBookIds((prev) => {
      const newBookIds = prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId];
      
      // Remove topic configs for topics from deselected books
      if (!newBookIds.includes(bookId)) {
        const bookTopics = allTopics.filter(t => t.book_id === bookId).map(t => t.$id);
        setTopicConfigs(prevConfigs => 
          prevConfigs.filter(config => !bookTopics.includes(config.topic_id))
        );
      }
      
      setValue('book_ids', newBookIds);
      return newBookIds;
    });
  };

  const handleTopicToggle = (topicId) => {
    setTopicConfigs((prev) => {
      const exists = prev.find(config => config.topic_id === topicId);
      if (exists) {
        // Remove topic config
        const newConfigs = prev.filter(config => config.topic_id !== topicId);
        setValue('topic_configs', newConfigs);
        return newConfigs;
      } else {
        // Add topic config with default "all" selection
        const newConfig = {
          topic_id: topicId,
          selection_type: 'all',
        };
        const newConfigs = [...prev, newConfig];
        setValue('topic_configs', newConfigs);
        return newConfigs;
      }
    });
  };

  const updateTopicConfig = (topicId, updates) => {
    setTopicConfigs((prev) => {
      const newConfigs = prev.map(config => {
        if (config.topic_id === topicId) {
          return { ...config, ...updates };
        }
        return config;
      });
      setValue('topic_configs', newConfigs);
      return newConfigs;
    });
  };

  const calculateTotalQuestions = (configs) => {
    let total = 0;
    for (const config of configs) {
      if (config.selection_type === 'all') {
        // Count all available questions for this topic
        const count = topicQuestionCounts[config.topic_id] || 0;
        total += count;
      } else if (config.selection_type === 'random' && config.random_count) {
        // Add the random count
        total += config.random_count;
      }
    }
    return total;
  };

  const calculateTotalPoints = async (configs) => {
    let totalPoints = 0;
    
    // Import getQuestionsByTopic to fetch ALL questions without limit
    const { getQuestionsByTopic } = await import('../../services/questionService');
    
    for (const config of configs) {
      try {
        // Fetch ALL questions for this topic (no limit)
        const response = await getQuestionsByTopic(config.topic_id);
        const questions = response?.documents || [];
        
        if (config.selection_type === 'all') {
          // Sum all question points
          const topicPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
          totalPoints += topicPoints;
        } else if (config.selection_type === 'random' && config.random_count) {
          // For random, we need to estimate. Since we don't know which questions will be selected,
          // we'll calculate average points per question and multiply by random_count
          if (questions.length > 0) {
            const avgPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0) / questions.length;
            // Estimate: average points * random_count
            // But to be more accurate, we could sum all points and divide proportionally
            // For now, let's use average * count
            totalPoints += Math.round(avgPoints * config.random_count);
          }
        }
      } catch (error) {
        console.error(`Error fetching questions for topic ${config.topic_id}:`, error);
      }
    }
    
    return totalPoints;
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validate topic_configs
      if (!topicConfigs || topicConfigs.length === 0) {
        showError('Please select at least one topic');
        return;
      }

      // Validate random_count doesn't exceed available questions
      for (const config of topicConfigs) {
        if (config.selection_type === 'random' && config.random_count) {
          const availableCount = topicQuestionCounts[config.topic_id] || 0;
          if (config.random_count > availableCount) {
            showError(`Random count (${config.random_count}) cannot exceed available questions (${availableCount}) for topic`);
            return;
          }
        }
      }

      // Calculate total questions and total points
      const totalQuestions = calculateTotalQuestions(topicConfigs);
      const totalPoints = await calculateTotalPoints(topicConfigs);

      const quizData = {
        ...data,
        book_ids: selectedBookIds,
        topic_configs: topicConfigs,
        total_questions: totalQuestions,
        total_points: totalPoints,
      };

      if (isEdit) {
        await updateQuiz(id, quizData);
        showSuccess('Quiz updated successfully');
      } else {
        if (!user?.$id) {
          showError('User not authenticated. Please log in again.');
          return;
        }
        await createQuiz(quizData, user.$id);
        showSuccess('Quiz created successfully');
      }
      navigate(ROUTES.ADMIN.QUIZZES);
    } catch (error) {
      console.error('Error saving quiz:', error);
      showError(error.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const getTopicConfig = (topicId) => {
    return topicConfigs.find(config => config.topic_id === topicId);
  };

  const getTopicsByBook = (bookId) => {
    return allTopics.filter(topic => topic.book_id === bookId);
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Link to={ROUTES.ADMIN.QUIZZES}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Quiz' : 'Create New Quiz'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update quiz details and question selection' : 'Create a quiz from multiple books and topics'}
          </p>
        </div>
      </div>

      <Card className="p-8 shadow-xl border-0 bg-gradient-to-br from-white via-gray-50/50 to-white">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Basic Information
            </h2>
            
            <Input
              label="Quiz Title"
              placeholder="Enter quiz title"
              error={errors.title?.message}
              {...register('title')}
              required
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Description <span className="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter quiz description..."
                className={cn(
                  "w-full px-4 py-3 text-gray-900 bg-white border rounded-xl",
                  "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                  "placeholder:text-gray-400 border-gray-300 hover:border-gray-400 shadow-sm resize-none",
                  errors.description && "border-red-500 focus:ring-red-500"
                )}
                {...register('description')}
              />
            </div>

            <Input
              label="Duration (minutes)"
              type="number"
              placeholder="60"
              error={errors.duration_minutes?.message}
              {...register('duration_minutes', { valueAsNumber: true })}
              required
            />
          </div>

          {/* Book Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Select Books <span className="text-red-500">*</span>
              </h2>
              {selectedBookIds.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedBookIds.length} book{selectedBookIds.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            
            {errors.book_ids && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.book_ids.message}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              {books.length === 0 ? (
                <p className="text-sm text-gray-500 col-span-full">No books available</p>
              ) : (
                books.map((book) => (
                  <label
                    key={book.$id}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      selectedBookIds.includes(book.$id)
                        ? "bg-indigo-50 border-indigo-300 shadow-sm"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBookIds.includes(book.$id)}
                      onChange={() => handleBookToggle(book.$id)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900 block">{book.title}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Topic Selection and Configuration */}
          {selectedBookIds.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  Configure Topics & Questions <span className="text-red-500">*</span>
                </h2>
                {topicConfigs.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {topicConfigs.length} topic{topicConfigs.length !== 1 ? 's' : ''} configured
                  </span>
                )}
              </div>

              {errors.topic_configs && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.topic_configs.message}
                </p>
              )}

              <div className="space-y-6">
                {selectedBookIds.map((bookId) => {
                  const book = books.find(b => b.$id === bookId);
                  const bookTopics = getTopicsByBook(bookId);
                  
                  if (bookTopics.length === 0) {
                    return (
                      <div key={bookId} className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-sm text-yellow-800">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          No topics found in "{book?.title || 'Unknown Book'}"
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div key={bookId} className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        {book?.title || 'Unknown Book'}
                      </h3>
                      
                      <div className="space-y-3">
                        {bookTopics.map((topic) => {
                          const config = getTopicConfig(topic.$id);
                          const isSelected = !!config;
                          const questionCount = topicQuestionCounts[topic.$id] || 0;

                          return (
                            <div
                              key={topic.$id}
                              className={cn(
                                "p-4 rounded-xl border-2 transition-all",
                                isSelected
                                  ? "bg-indigo-50/50 border-indigo-200 shadow-sm"
                                  : "bg-white border-gray-200"
                              )}
                            >
                              <div className="flex items-start gap-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTopicToggle(topic.$id)}
                                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                                />
                                
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-semibold text-gray-900 block">{topic.title}</span>
                                      <span className="text-xs text-gray-500 mt-1">
                                        {questionCount} question{questionCount !== 1 ? 's' : ''} available
                                      </span>
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <div className="pl-9 space-y-3 pt-2 border-t border-indigo-200">
                                      <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`selection_type_${topic.$id}`}
                                            checked={config.selection_type === 'all'}
                                            onChange={() => updateTopicConfig(topic.$id, { selection_type: 'all', random_count: undefined })}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                          />
                                          <span className="text-sm font-medium text-gray-700">All Questions</span>
                                        </label>
                                        
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`selection_type_${topic.$id}`}
                                            checked={config.selection_type === 'random'}
                                            onChange={() => updateTopicConfig(topic.$id, { selection_type: 'random', random_count: 1 })}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                          />
                                          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                            <Shuffle className="w-3 h-3" />
                                            Random
                                          </span>
                                        </label>
                                      </div>

                                      {config.selection_type === 'random' && (
                                        <div className="pl-6">
                                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                            Number of questions (max: {questionCount})
                                          </label>
                                          <input
                                            type="number"
                                            min="1"
                                            max={questionCount}
                                            value={config.random_count || ''}
                                            onChange={(e) => {
                                              const count = parseInt(e.target.value) || 1;
                                              const validCount = Math.min(Math.max(1, count), questionCount);
                                              updateTopicConfig(topic.$id, { random_count: validCount });
                                            }}
                                            className={cn(
                                              "w-32 px-3 py-2 text-sm border rounded-lg",
                                              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                                              "border-gray-300"
                                            )}
                                            placeholder="1"
                                          />
                                          <p className="text-xs text-gray-500 mt-1">
                                            Questions will be randomly selected each time the quiz is started
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Publish Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              {...register('is_published')}
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              id="is_published"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              Publish quiz (make it available to students)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <Link to={ROUTES.ADMIN.QUIZZES}>
              <Button variant="outline" size="lg">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              variant="primary" 
              size="lg"
              loading={loading} 
              leftIcon={<Save className="w-5 h-5" />}
              className="px-8"
            >
              {isEdit ? 'Update Quiz' : 'Create Quiz'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default QuizForm;
