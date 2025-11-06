import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { Card, Button, Spinner } from '../../components/ui';
import { ROUTES } from '../../utils/constants';
import { getQuiz } from '../../services/quizService';
import { getAttempt, parseAnswers } from '../../services/attemptService';
import { parseOptions } from '../../services/questionService';
import { useUIStore } from '../../stores';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../lib/utils';

function QuizResults() {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const attemptId = searchParams.get('attempt');
  const showError = useUIStore((state) => state.showError);
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    if (attemptId) {
      loadResults();
    } else {
      showError('Attempt ID not found');
      navigate(ROUTES.STUDENT.HISTORY);
    }
  }, [attemptId, quizId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      
      // Load attempt
      const attemptData = await getAttempt(attemptId);
      if (!attemptData) {
        showError('Attempt not found');
        navigate(ROUTES.STUDENT.HISTORY);
        return;
      }

      // Load quiz
      const quizData = await getQuiz(quizId || attemptData.quiz_id);
      if (!quizData) {
        showError('Quiz not found');
        navigate(ROUTES.STUDENT.HISTORY);
        return;
      }

      setQuiz(quizData);
      setAttempt(attemptData);

      // Parse answers from attempt
      const parsedAnswers = parseAnswers(attemptData.answers || []);
      setAnswers(parsedAnswers);

      // Load questions - use stored question_ids from attempt if available (for random mode)
      // Otherwise, fetch questions from quiz config (for backward compatibility)
      if (attemptData.question_ids && Array.isArray(attemptData.question_ids) && attemptData.question_ids.length > 0) {
        // Use exact questions that were shown during the attempt
        const { getQuestionsByIds } = await import('../../services/questionService');
        const quizQuestions = await getQuestionsByIds(attemptData.question_ids);
        setQuestions(quizQuestions);
      } else {
        // Fallback: Load questions from quiz config (for old attempts without question_ids)
        const topicConfigs = quizData.topic_configs || [];
        if (topicConfigs.length > 0) {
          const { getQuizQuestions, parseTopicConfigs } = await import('../../services/quizService');
          const parsedConfigs = parseTopicConfigs(topicConfigs);
          const quizQuestions = await getQuizQuestions(parsedConfigs);
          setQuestions(quizQuestions);
        }
      }
    } catch (error) {
      console.error('Error loading results:', error);
      showError('Failed to load quiz results');
      navigate(ROUTES.STUDENT.HISTORY);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!quiz || !attempt) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Results not found</p>
          <Link to={ROUTES.STUDENT.HISTORY}>
            <Button className="mt-4">Back to History</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Recalculate score and points from answers to ensure accuracy
  let calculatedPointsEarned = 0;
  let calculatedTotalPoints = 0;
  let calculatedCorrectCount = 0;

  answers.forEach(a => {
    const question = questions.find(q => q.$id === a.question_id);
    if (!question) return;
    
    const questionPoints = question.points || 1;
    calculatedTotalPoints += questionPoints;
    
    const options = parseOptions(question.options || []);
    const correctIndex = options.findIndex(opt => opt.isCorrect);
    const isCorrect = a.selected_option !== null && 
                     a.selected_option !== undefined && 
                     a.selected_option === correctIndex;
    
    if (isCorrect) {
      calculatedPointsEarned += questionPoints;
      calculatedCorrectCount++;
    }
  });

  // Use calculated values instead of stored values for accuracy
  const pointsEarned = calculatedPointsEarned;
  const totalPoints = calculatedTotalPoints || attempt.total_points || 0;
  const correctCount = calculatedCorrectCount;
  const score = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;

  // Match answers with questions
  const answerMap = {};
  answers.forEach(ans => {
    answerMap[ans.question_id] = ans;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.STUDENT.HISTORY}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quiz Results</h1>
          <p className="text-sm text-gray-600 mt-1">{quiz.title}</p>
        </div>
      </div>

      {/* Score Summary */}
      <Card className="p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Your Score</p>
            <p className="text-4xl font-bold text-gray-900">{score}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Points</p>
            <p className="text-2xl font-semibold text-gray-900">{pointsEarned} / {totalPoints}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-600 mb-1">Correct</p>
            <p className="text-lg font-semibold text-gray-900">{correctCount} / {questions.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Incorrect</p>
            <p className="text-lg font-semibold text-gray-900">{questions.length - correctCount} / {questions.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(attempt.completed_at || attempt.$updatedAt)}</p>
          </div>
        </div>
      </Card>

      {/* Questions Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Question Review</h2>
        
        {questions.map((question, index) => {
          const answer = answerMap[question.$id];
          const options = parseOptions(question.options || []);
          const correctIndex = options.findIndex(opt => opt.isCorrect);
          const selectedIndex = answer?.selected_option;
          const isCorrect = selectedIndex === correctIndex;
          const isSkipped = selectedIndex === null || selectedIndex === undefined;

          return (
            <Card key={question.$id} className="p-5 border border-gray-200">
              <div className="flex items-start gap-3 mb-4">
                <div className={cn(
                  "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
                  isCorrect ? "bg-gray-100" : isSkipped ? "bg-gray-50" : "bg-gray-200"
                )}>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-gray-700" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-600">Question {index + 1}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      isCorrect ? "bg-gray-100 text-gray-700" : isSkipped ? "bg-gray-50 text-gray-600" : "bg-gray-200 text-gray-700"
                    )}>
                      {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                    </span>
                  </div>
                  <h3 className="text-base font-medium text-gray-900">
                    {question.question_text}
                  </h3>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 ml-11">
                {options.map((option, optIndex) => {
                  const isSelected = selectedIndex === optIndex;
                  const isCorrectOption = optIndex === correctIndex;
                  const isWrongSelected = isSelected && !isCorrectOption;

                  return (
                    <div
                      key={optIndex}
                      className={cn(
                        "p-2.5 rounded border flex items-center gap-3",
                        isCorrectOption
                          ? "border-green-300 bg-green-50"
                          : isWrongSelected
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded flex items-center justify-center text-xs font-medium",
                        isCorrectOption
                          ? "bg-green-600 text-white"
                          : isWrongSelected
                            ? "bg-red-600 text-white"
                            : "bg-gray-200 text-gray-700"
                      )}>
                        {String.fromCharCode(65 + optIndex)}
                      </div>
                      <span className={cn(
                        "flex-1 text-sm",
                        isCorrectOption
                          ? "text-green-900 font-medium"
                          : isWrongSelected
                            ? "text-red-900 font-medium"
                            : "text-gray-900"
                      )}>{option.text}</span>
                      {isCorrectOption && (
                        <span className="text-xs text-green-700 font-semibold">Correct</span>
                      )}
                      {isWrongSelected && (
                        <span className="text-xs text-red-700 font-semibold">Your Answer (Wrong)</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {question.explanation && (
                <div className="mt-3 ml-11 p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-xs font-medium text-gray-700 mb-1">Explanation:</p>
                  <p className="text-xs text-gray-600">{question.explanation}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-4">
        <Link to={ROUTES.STUDENT.QUIZZES}>
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Quizzes
          </Button>
        </Link>
        <Link to={ROUTES.STUDENT.HISTORY}>
          <Button variant="outline">
            View History
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default QuizResults;
