import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Clock, Trash2 } from 'lucide-react';
import { Button, Card, Badge, Spinner, Modal } from '../../components/ui';
import { ROUTES } from '../../utils/constants';
import { getAttempt, deleteAttempt } from '../../services/attemptService';
import { getAdminAttemptDetailData } from '../../services/adminAttemptDetailService';
import { useUIStore } from '../../stores';
import { formatDate, formatDateTimeIST, formatDuration } from '../../utils/formatters';
import { parseAnswers } from '../../services/attemptService';
import { parseOptions } from '../../services/questionService';
import { getQuizQuestions, parseTopicConfigs } from '../../services/quizService';
import { QUIZ_ATTEMPT_STATUS } from '../../utils/constants';

function AttemptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  useEffect(() => {
    loadAttempt();
  }, [id]);

  const loadAttempt = async () => {
    try {
      setLoading(true);
      // Single optimized call to get attempt, quiz, and user data
      const { attempt: attemptData, quiz: quizData, user: userData } = await getAdminAttemptDetailData(id);
      setAttempt(attemptData);
      setQuiz(quizData);
      setUser(userData);
      
      // Load questions for answer review
      if (quizData?.topic_configs) {
        const parsedConfigs = parseTopicConfigs(quizData.topic_configs);
        const quizQuestions = await getQuizQuestions(parsedConfigs);
        setQuestions(quizQuestions);
      }
    } catch (error) {
      console.error('Error loading attempt:', error);
      showError('Failed to load attempt details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAttempt(id);
      showSuccess('Attempt deleted successfully');
      navigate(ROUTES.ADMIN.ATTEMPTS);
    } catch (error) {
      console.error('Error deleting attempt:', error);
      showError('Failed to delete attempt');
    }
  };

  // Calculate time spent from started_at and completed_at
  const calculateTimeSpent = () => {
    if (!attempt?.started_at || !attempt?.completed_at) {
      return 0;
    }
    const start = new Date(attempt.started_at);
    const end = new Date(attempt.completed_at);
    const diffInSeconds = Math.floor((end - start) / 1000);
    return diffInSeconds;
  };

  // Calculate score and percentage
  const getScore = () => {
    if (attempt?.points_earned !== undefined && attempt?.total_points !== undefined) {
      return {
        earned: Number(attempt.points_earned) || 0,
        total: Number(attempt.total_points) || 0,
      };
    }
    return { earned: 0, total: 0 };
  };

  const getPercentage = () => {
    const { earned, total } = getScore();
    if (!total || total === 0) return 0;
    return Math.round((earned / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Attempt not found</p>
        <Link to={ROUTES.ADMIN.ATTEMPTS}>
          <Button variant="primary" className="mt-4">Back to Attempts</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case QUIZ_ATTEMPT_STATUS.COMPLETED:
        return <Badge variant="success">Completed</Badge>;
      case QUIZ_ATTEMPT_STATUS.ABANDONED:
        return <Badge variant="warning">Abandoned</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={ROUTES.ADMIN.ATTEMPTS}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Attempt Details</h1>
          <p className="text-gray-600 mt-1">Review student answers and performance</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash2 className="w-4 h-4" />}
          onClick={() => setDeleteModal(true)}
        >
          Delete
        </Button>
      </div>

      {/* Summary Card */}
      <Card variant="elevated" className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-indigo-50 rounded-xl">
            <Trophy className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {(() => {
                const score = getScore();
                return `${score.earned}/${score.total}`;
              })()}
            </p>
            <p className="text-sm text-gray-600">Score</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {getPercentage()}%
            </p>
            <p className="text-sm text-gray-600">Percentage</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {formatDuration(calculateTimeSpent(), 'seconds')}
            </p>
            <p className="text-sm text-gray-600">Time Spent</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-xl">
            <CheckCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="mb-2">
              {getStatusBadge(attempt.status)}
            </div>
            <p className="text-sm text-gray-600">Status</p>
          </div>
        </div>
      </Card>

      {/* Quiz Info */}
      {quiz && (
        <Card variant="elevated" className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quiz Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Quiz Title</p>
              <p className="font-semibold text-gray-900">{quiz.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="font-semibold text-gray-900">{quiz.total_points}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Attempt Date & Time</p>
              <p className="font-semibold text-gray-900">{formatDateTimeIST(attempt.completed_at || attempt.$updatedAt || attempt.$createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Student Email</p>
              <p className="font-semibold text-gray-900">{user?.email || attempt.student_id || 'Unknown'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Answers Review */}
      <Card variant="elevated" className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Answers Review</h2>
        <div className="space-y-4">
          {attempt.answers && attempt.answers.length > 0 && questions.length > 0 ? (
            (() => {
              const parsedAnswers = parseAnswers(attempt.answers);
              return parsedAnswers.map((answer, index) => {
                const question = questions.find(q => q.$id === answer.question_id);
                if (!question) {
                  return (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
                      <p className="text-sm text-gray-700 mt-2">Question not found</p>
                    </div>
                  );
                }
                
                const options = parseOptions(question.options || []);
                const correctIndex = options.findIndex(opt => opt.isCorrect);
                const selectedIndex = answer.selected_option;
                const isCorrect = selectedIndex !== null && selectedIndex !== undefined && 
                                 selectedIndex === correctIndex;
                const isSkipped = selectedIndex === null || selectedIndex === undefined;
                
                // Get selected option text
                let selectedOptionText = 'No answer';
                if (!isSkipped && selectedIndex >= 0 && selectedIndex < options.length) {
                  selectedOptionText = `${String.fromCharCode(65 + selectedIndex)}. ${options[selectedIndex].text}`;
                }
                
                // Get correct option text
                let correctOptionText = '';
                if (correctIndex >= 0 && correctIndex < options.length) {
                  correctOptionText = `${String.fromCharCode(65 + correctIndex)}. ${options[correctIndex].text}`;
                }
                
                return (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : isSkipped ? (
                            <span className="text-xs text-gray-500">Skipped</span>
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-3">{question.question_text}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className={isSkipped ? "text-sm text-gray-600" : "text-sm font-medium text-gray-700"}>
                        <span className="text-gray-600">Selected: </span>
                        <span className={isCorrect ? "text-green-700" : isSkipped ? "text-gray-500" : "text-red-700"}>
                          {selectedOptionText}
                        </span>
                      </div>
                      {!isSkipped && !isCorrect && (
                        <div className="text-sm text-gray-700">
                          <span className="text-gray-600">Correct Answer: </span>
                          <span className="text-green-700 font-medium">{correctOptionText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()
          ) : attempt.answers && attempt.answers.length > 0 ? (
            <p className="text-gray-600 text-center py-8">Loading questions...</p>
          ) : (
            <p className="text-gray-600 text-center py-8">No answers recorded for this attempt</p>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Quiz Attempt"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this quiz attempt? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModal(false)}
            >
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

export default AttemptDetail;

