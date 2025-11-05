import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, Send, X } from 'lucide-react';
import { Button, Modal, Spinner } from '../../components/ui';
import { ROUTES } from '../../utils/constants';
import { getQuiz, getQuizQuestions, parseTopicConfigs } from '../../services/quizService';
import { createAttempt, completeAttempt } from '../../services/attemptService';
import { parseOptions } from '../../services/questionService';
import useQuizStore from '../../stores/quizStore';
import { useAuthStore } from '../../stores';
import { useUIStore } from '../../stores';
import { cn } from '../../lib/utils';

// Shuffle function using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle questions and options while tracking correct answers
function shuffleQuestionsAndOptions(questions) {
  // Shuffle questions
  const shuffledQuestions = shuffleArray(questions);
  
  // Shuffle options for each question and track correct answer index
  return shuffledQuestions.map(question => {
    const options = parseOptions(question.options || []);
    
    // Create array with original indices
    const optionsWithIndex = options.map((opt, idx) => ({
      ...opt,
      originalIndex: idx,
    }));
    
    // Shuffle options
    const shuffledOptions = shuffleArray(optionsWithIndex);
    
    // Find the new index of the correct answer
    const correctAnswerNewIndex = shuffledOptions.findIndex(opt => opt.isCorrect);
    
    return {
      ...question,
      options: shuffledOptions.map(opt => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
        originalIndex: opt.originalIndex, // Keep original index for mapping back
      })),
      correctAnswerIndex: correctAnswerNewIndex, // Store the correct answer index after shuffling
      originalOptions: options, // Keep original for reference if needed
    };
  });
}

function QuizTaking() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const showError = useUIStore((state) => state.showError);
  const showSuccess = useUIStore((state) => state.showSuccess);
  
  const {
    currentQuiz,
    currentAttempt,
    questions,
    currentQuestionIndex,
    timeRemaining,
    markedForReview,
    startQuiz,
    setAnswer,
    getAnswer,
    nextQuestion,
    previousQuestion,
    toggleMarkForReview,
    isMarkedForReview,
    getProgress,
    resetQuiz,
    getTimeRemainingFormatted,
  } = useQuizStore();

  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) return;

    // If quiz is already loaded and matches current quizId, just shuffle questions
    if (currentQuiz && currentQuiz.$id === quizId && questions.length > 0 && currentAttempt) {
      if (shuffledQuestions.length === 0) {
        // Shuffle questions and options on first load
        const shuffled = shuffleQuestionsAndOptions(questions);
        setShuffledQuestions(shuffled);
      }
      setLoading(false);
      return;
    }

    // Load quiz if not already loaded - only when quizId changes
    if (quizId && (!currentQuiz || currentQuiz.$id !== quizId || !currentAttempt)) {
      loadQuiz();
    }
  }, [quizId]); // Only depend on quizId to prevent re-runs

  useEffect(() => {
    // Auto-submit when time runs out
    if (timeRemaining === 0 && currentQuiz) {
      handleAutoSubmit();
    }
  }, [timeRemaining]);

  const loadQuiz = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      
      if (!user?.$id) {
        showError('You must be logged in to take a quiz');
        navigate(ROUTES.STUDENT.QUIZZES);
        return;
      }

      // Check if attempt already exists for this quiz
      if (currentAttempt && currentAttempt.quiz_id === quizId && currentAttempt.status === 'in_progress') {
        // Use existing attempt
        const quiz = await getQuiz(quizId);
        if (quiz && questions.length > 0) {
          const shuffled = shuffleQuestionsAndOptions(questions);
          setShuffledQuestions(shuffled);
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
      }

      // Load quiz
      const quiz = await getQuiz(quizId);
      if (!quiz) {
        showError('Quiz not found');
        navigate(ROUTES.STUDENT.QUIZZES);
        return;
      }

      if (!quiz.is_published) {
        showError('This quiz is not available');
        navigate(ROUTES.STUDENT.QUIZZES);
        return;
      }

      // Parse topic configs and get questions
      const topicConfigs = parseTopicConfigs(quiz.topic_configs || []);
      const quizQuestions = await getQuizQuestions(topicConfigs);

      if (quizQuestions.length === 0) {
        showError('No questions available for this quiz');
        navigate(ROUTES.STUDENT.QUIZZES);
        return;
      }

      // Create attempt only if we don't have one
      let attempt = currentAttempt;
      if (!attempt || attempt.quiz_id !== quizId || attempt.status !== 'in_progress') {
        attempt = await createAttempt({ quiz_id: quizId }, user.$id);
      }

      // Start quiz with original questions (will be shuffled in useEffect)
      startQuiz(quiz, attempt, quizQuestions);
      
      // Shuffle questions and options
      const shuffled = shuffleQuestionsAndOptions(quizQuestions);
      setShuffledQuestions(shuffled);
      setLoading(false);
    } catch (error) {
      console.error('Error loading quiz:', error);
      showError('Failed to load quiz');
      navigate(ROUTES.STUDENT.QUIZZES);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const handleAutoSubmit = async () => {
    try {
      setSubmitting(true);
      await calculateAndSubmit();
      showSuccess('Quiz auto-submitted! Time ran out.');
    } catch (error) {
      console.error('Error auto-submitting quiz:', error);
      showError('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    setSubmitModal(true);
  };

  const calculateAndSubmit = async () => {
    if (!currentQuiz || !currentAttempt || shuffledQuestions.length === 0) return;

    // Calculate points using shuffled questions
    let pointsEarned = 0;
    let totalPoints = 0;
    const submittedAnswers = [];

    for (const question of shuffledQuestions) {
      const questionPoints = question.points || 1;
      totalPoints += questionPoints; // Sum all question points for total

      // Get selected answer (single choice - just one value)
      // If user skipped, selectedIndex will be null/undefined
      const selectedShuffledIndex = getAnswer(question.$id);
      
      // Map shuffled index back to original index
      let selectedOriginalIndex = null;
      if (selectedShuffledIndex !== null && selectedShuffledIndex !== undefined) {
        const shuffledIndex = parseInt(selectedShuffledIndex);
        const selectedOption = question.options[shuffledIndex];
        if (selectedOption && selectedOption.originalIndex !== undefined) {
          selectedOriginalIndex = selectedOption.originalIndex;
        }
      }
      
      // Check if answer is correct using shuffled index (for scoring)
      const isCorrect = selectedShuffledIndex !== null && selectedShuffledIndex !== undefined && 
                       parseInt(selectedShuffledIndex) === question.correctAnswerIndex;

      if (isCorrect) {
        pointsEarned += questionPoints; // Add question points only if correct
      }

      // Store original option index (not shuffled) so it matches results page
      submittedAnswers.push({
        question_id: question.$id,
        selected_option: selectedOriginalIndex, // Store original index, not shuffled
      });
    }

    const percentage = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;

    // Update attempt with final answers, points, and score
    await completeAttempt(
      currentAttempt.$id,
      submittedAnswers,
      pointsEarned, // points_earned
      totalPoints,  // total_points
      percentage
    );

    // Reset quiz state
    resetQuiz();

    // Navigate to results
    navigate(`${ROUTES.STUDENT.QUIZZES}/${quizId}/results?attempt=${currentAttempt.$id}`);
  };

  const handleConfirmSubmit = async () => {
    setSubmitModal(false);
    try {
      setSubmitting(true);
      await calculateAndSubmit();
      showSuccess('Quiz submitted successfully!');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      showError('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitQuiz = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be saved but the quiz will be marked as incomplete.')) {
      resetQuiz();
      navigate(ROUTES.STUDENT.QUIZZES);
    }
  };

  if (loading || submitting) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-600 mt-4 text-lg">{loading ? 'Loading quiz...' : 'Submitting quiz...'}</p>
        </div>
      </div>
    );
  }

  if (!currentQuiz || shuffledQuestions.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No quiz loaded</h3>
          <Button onClick={() => navigate(ROUTES.STUDENT.QUIZZES)}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const progress = getProgress();
  const selectedAnswer = getAnswer(currentQuestion?.$id); // Single choice - just one value
  const options = currentQuestion?.options || [];
  const isLowTime = timeRemaining < 300; // Less than 5 minutes

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden z-50">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <button
          onClick={handleExitQuiz}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          title="Exit Quiz"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-sm text-gray-600">
          {currentQuiz.title}
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Panel - Quiz Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Quiz Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 relative">
              {/* Quiz Title and Timer Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900 mb-3">{currentQuiz.title}</h1>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Question Count */}
                  <p className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
                  </p>
                </div>

                {/* Timer */}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm",
                  isLowTime ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-700"
                )}>
                  <Clock className={cn("w-4 h-4", isLowTime && "animate-pulse")} />
                  <span className="font-medium">{getTimeRemainingFormatted()}</span>
                </div>
              </div>

              {/* Question Block */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-5">
                  {currentQuestion?.question_text}
                </h2>

                {/* Options */}
                <div className="space-y-2.5">
                  {options.map((option, index) => {
                    const isSelected = selectedAnswer === index.toString();

                    return (
                      <label
                        key={index}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-all",
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.$id}`}
                          checked={isSelected}
                          onChange={() => {
                            // Single choice - set only this option
                            setAnswer(currentQuestion.$id, isSelected ? null : index.toString());
                          }}
                          className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="flex-1 text-gray-900 text-sm">
                          {option.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  className="px-4 py-2 text-sm"
                >
                  Previous
                </Button>

                {currentQuestionIndex < shuffledQuestions.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={nextQuestion}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    className="px-4 py-2 text-sm"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSubmitClick}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700"
                  >
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Question Navigation */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <h3 className="text-base font-semibold text-gray-900 mb-4">Question Navigation</h3>
            
            {/* Progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Progress</span>
                <span className="text-xs font-semibold text-gray-900">{progress.answered}/{shuffledQuestions.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {shuffledQuestions.map((q, index) => {
                const hasAnswer = getAnswer(q.$id) !== null && getAnswer(q.$id) !== undefined;
                const isCurrent = index === currentQuestionIndex;

                return (
                  <button
                    key={q.$id}
                    onClick={() => {
                      const { goToQuestion } = useQuizStore.getState();
                      goToQuestion(index);
                    }}
                    className={cn(
                      "w-10 h-10 rounded-md font-medium text-xs transition-all duration-200 border",
                      isCurrent
                        ? "bg-blue-600 text-white border-blue-700"
                        : hasAnswer
                          ? "bg-green-500 text-white border-green-600"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    )}
                    title={`Question ${index + 1}${hasAnswer ? ' - Answered' : ' - Unanswered'}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-xs font-semibold text-gray-900 mb-3">LEGEND</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded border border-blue-700"></div>
                  <span className="text-xs text-gray-700">Current Question</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded border border-green-600"></div>
                  <span className="text-xs text-gray-700">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 rounded border border-gray-300"></div>
                  <span className="text-xs text-gray-700">Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={submitModal}
        onClose={() => setSubmitModal(false)}
        title="Submit Quiz"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to submit your quiz? You have answered {progress.answered} out of {progress.total} questions.
          </p>
          {progress.unanswered > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ You have {progress.unanswered} unanswered question{progress.unanswered !== 1 ? 's' : ''}. You can still submit.
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setSubmitModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmSubmit} loading={submitting}>
              Submit Quiz
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default QuizTaking;
