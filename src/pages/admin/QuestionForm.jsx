import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle2, Circle, HelpCircle, BookOpen, Tag, Award, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import NativeSelect from '../../components/ui/NativeSelect';
import { questionSchema } from '../../utils/validators';
import { createQuestion, updateQuestion, getQuestion, parseOptions } from '../../services/questionService';
import { getBooksForDropdown } from '../../services/bookService';
import { getTopics } from '../../services/topicService';
import { useUIStore } from '../../stores';
import { useAuthStore } from '../../stores';
import { ROUTES, QUESTION_TYPES, DIFFICULTY_LEVELS } from '../../utils/constants';
import { cn } from '../../lib/utils';

function QuestionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [books, setBooks] = useState([]);
  const [topics, setTopics] = useState([]);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
    setValue,
  } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_type: 'multiple_choice',
      difficulty: 'medium',
      points: 1,
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const selectedBook = watch('book_id');
  const selectedTopic = watch('topic_id');
  const questionType = watch('question_type');
  const selectedDifficulty = watch('difficulty');

  useEffect(() => {
    loadBooks();
    if (isEdit) {
      loadQuestion();
    }
  }, [id]);

  useEffect(() => {
    if (selectedBook) {
      loadTopics();
    }
  }, [selectedBook]);

  useEffect(() => {
    if (questionType === 'true_false') {
      // Ensure exactly 2 options for True/False
      if (fields.length !== 2) {
        reset({
          ...watch(),
          options: [
            { text: 'True', isCorrect: false },
            { text: 'False', isCorrect: false },
          ],
        });
      } else {
        // Update existing options to True/False if they're not already
        setValue('options.0.text', 'True');
        setValue('options.1.text', 'False');
      }
    } else if (questionType === 'multiple_choice') {
      // Ensure exactly 4 options for MCQ and clear True/False text
      const currentOptions = watch('options') || [];
      const newOptions = [];
      
      // Reset first 2 options if they contain True/False
      for (let i = 0; i < Math.max(4, currentOptions.length); i++) {
        if (i < currentOptions.length) {
          // Clear True/False text from first 2 options if switching from True/False
          const text = currentOptions[i].text;
          if (text === 'True' || text === 'False') {
            newOptions.push({ text: '', isCorrect: currentOptions[i].isCorrect || false });
          } else {
            newOptions.push({ ...currentOptions[i] });
          }
        } else {
          newOptions.push({ text: '', isCorrect: false });
        }
      }
      
      // Ensure exactly 4 options
      if (newOptions.length !== 4) {
        while (newOptions.length < 4) {
          newOptions.push({ text: '', isCorrect: false });
        }
        newOptions.splice(4);
      }
      
      reset({
        ...watch(),
        options: newOptions,
      });
    }
  }, [questionType, fields.length, reset, watch, setValue]);

  const loadBooks = async () => {
    try {
      // Use optimized function for dropdown - only fetches id and title
      const booksList = await getBooksForDropdown();
      setBooks(booksList);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const loadTopics = async () => {
    try {
      const options = selectedBook ? { bookId: selectedBook } : {};
      const response = await getTopics(options);
      setTopics(response?.documents || []);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const question = await getQuestion(id);
      if (question) {
        // Parse options from array of JSON strings to array of objects
        const options = parseOptions(question.options || []);
        
        reset({
          book_id: question.book_id,
          topic_id: question.topic_id,
          question_text: question.question_text,
          question_type: question.question_type,
          options: Array.isArray(options) ? options : [],
          points: question.points || 1,
          difficulty: question.difficulty || 'medium',
          explanation: question.explanation || '',
        });
      }
    } catch (error) {
      console.error('Error loading question:', error);
      showError('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEdit) {
        await updateQuestion(id, data);
        showSuccess('Question updated successfully');
      } else {
        if (!user?.$id) {
          showError('User not authenticated. Please log in again.');
          return;
        }
        await createQuestion(data, user.$id);
        showSuccess('Question created successfully');
      }
      navigate(ROUTES.ADMIN.QUESTIONS);
    } catch (error) {
      console.error('Error saving question:', error);
      showError(error.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Link to={ROUTES.ADMIN.QUESTIONS}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Question' : 'Create New Question'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update question details' : 'Add a new question to your quiz'}
          </p>
        </div>
      </div>

      <Card className="p-8 shadow-xl border-0 bg-gradient-to-br from-white via-gray-50/50 to-white">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Book and Topic Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Book <span className="text-red-500">*</span>
              </label>
              <NativeSelect 
                {...register('book_id')} 
                value={selectedBook}
                error={errors.book_id?.message} 
                required
              >
                <option value="">Select a book</option>
                {books.map((book) => (
                  <option key={book.$id} value={book.$id}>
                    {book.title}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag className="w-4 h-4 text-indigo-600" />
                Topic <span className="text-red-500">*</span>
              </label>
              <NativeSelect
                {...register('topic_id')}
                value={selectedTopic}
                error={errors.topic_id?.message}
                required
                disabled={!selectedBook}
              >
                <option value="">Select a topic</option>
                {topics.map((topic) => (
                  <option key={topic.$id} value={topic.$id}>
                    {topic.title}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          {/* Question Type */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              Question Type <span className="text-red-500">*</span>
            </label>
            <NativeSelect 
              {...register('question_type')} 
              value={questionType}
              error={errors.question_type?.message} 
              required
            >
              <option value="multiple_choice">Multiple Choice (MCQ)</option>
              <option value="true_false">True/False</option>
            </NativeSelect>
            {questionType === 'multiple_choice' && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                MCQ requires exactly 4 options with one correct answer
              </p>
            )}
            {questionType === 'true_false' && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                True/False requires exactly 2 options (True/False) with one correct answer
              </p>
            )}
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              Question Text <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Enter your question here... Be clear and specific."
              className={cn(
                "w-full px-4 py-3 text-gray-900 bg-white border rounded-xl",
                "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                "placeholder:text-gray-400 border-gray-300 hover:border-gray-400 shadow-sm",
                "resize-none",
                errors.question_text && "border-red-500 focus:ring-red-500"
              )}
              {...register('question_text')}
            />
            {errors.question_text && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.question_text.message}
              </p>
            )}
          </div>

          {/* Points and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Award className="w-4 h-4 text-indigo-600" />
                Points
              </label>
              <Input
                type="number"
                placeholder="1"
                error={errors.points?.message}
                {...register('points', { valueAsNumber: true })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                Difficulty <span className="text-red-500">*</span>
              </label>
              <NativeSelect 
                {...register('difficulty')} 
                value={selectedDifficulty}
                error={errors.difficulty?.message} 
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </NativeSelect>
            </div>
          </div>

          {/* Options Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Options <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-500 ml-2">
                  ({questionType === 'multiple_choice' ? '4 options required' : '2 options (True/False)'})
                </span>
              </label>
              {questionType === 'multiple_choice' && fields.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => append({ text: '', isCorrect: false })}
                >
                  Add Option
                </Button>
              )}
            </div>
            
            <div className={cn(
              "grid gap-4",
              questionType === 'true_false' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2"
            )}>
              {fields.map((field, index) => {
                const isCorrect = watch(`options.${index}.isCorrect`);
                return (
                  <div
                    key={field.id}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all duration-200",
                      "bg-white shadow-sm hover:shadow-md",
                      isCorrect
                        ? "border-green-500 bg-green-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                            isCorrect
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-600"
                          )}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-xs font-medium text-gray-500">
                            Option {index + 1}
                          </span>
                          {isCorrect && (
                            <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Correct Answer
                            </span>
                          )}
                        </div>
                        <Input
                          placeholder={questionType === 'true_false' 
                            ? (index === 0 ? 'True' : 'False')
                            : `Enter option ${index + 1}...`}
                          {...register(`options.${index}.text`)}
                          error={errors.options?.[index]?.text?.message}
                          disabled={questionType === 'true_false'}
                          className={cn(
                            isCorrect && "bg-green-50 border-green-300"
                          )}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2 pt-6">
                        <label className="flex flex-col items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="correct-option"
                            checked={isCorrect}
                            onChange={() => {
                              // Uncheck all other options
                              fields.forEach((_, i) => {
                                setValue(`options.${i}.isCorrect`, i === index);
                              });
                            }}
                            className="w-5 h-5 text-green-600 border-0 focus:ring-0 focus:ring-offset-0 outline-none mark-correct-radio"
                            style={{ border: 'none !important', outline: 'none !important', boxShadow: 'none' }}
                          />
                          <span className="text-xs font-medium text-gray-600 group-hover:text-green-600 transition-colors">
                            Mark Correct
                          </span>
                        </label>
                        {questionType === 'multiple_choice' && fields.length > 4 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Remove option"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {errors.options && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.options.message || 'Please ensure at least one option is marked as correct'}
                </p>
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              Explanation <span className="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Explain why this is the correct answer. This helps students understand the concept better..."
              className={cn(
                "w-full px-4 py-3 text-gray-900 bg-white border rounded-xl",
                "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                "placeholder:text-gray-400 border-gray-300 hover:border-gray-400 shadow-sm resize-none"
              )}
              {...register('explanation')}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <Link to={ROUTES.ADMIN.QUESTIONS}>
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
              {isEdit ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default QuestionForm;

