import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Eye, Filter, Trophy, Clock, Trash2 } from 'lucide-react';
import { Card, Input, Badge, Table, Button, Modal, Spinner } from '../../components/ui';
import NativeSelect from '../../components/ui/NativeSelect';
import { ROUTES } from '../../utils/constants';
import { getAdminAttemptsData } from '../../services/adminAttemptsService';
import { deleteAttempt } from '../../services/attemptService';
import { useUIStore } from '../../stores';
import { formatDate, formatDuration } from '../../utils/formatters';
import { QUIZ_ATTEMPT_STATUS } from '../../utils/constants';

function Attempts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [attempts, setAttempts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(searchParams.get('quiz') || '');
  const [selectedStudent, setSelectedStudent] = useState(searchParams.get('student') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, attempt: null });
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  useEffect(() => {
    loadData();
  }, [selectedQuiz, selectedStudent]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Single optimized call to get both attempts and quizzes in parallel
      const { attempts: attemptsList, quizzes: quizzesList } = await getAdminAttemptsData({
        quizId: selectedQuiz || undefined,
        studentId: selectedStudent || undefined,
        limit: 100,
      });
      setAttempts(attemptsList);
      setQuizzes(quizzesList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.attempt) return;
    
    try {
      await deleteAttempt(deleteModal.attempt.$id);
      showSuccess('Attempt deleted successfully');
      setDeleteModal({ open: false, attempt: null });
      loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting attempt:', error);
      showError('Failed to delete attempt');
    }
  };

  // Calculate time spent from started_at and completed_at
  const calculateTimeSpent = (attempt) => {
    if (!attempt.started_at || !attempt.completed_at) {
      return 0;
    }
    const start = new Date(attempt.started_at);
    const end = new Date(attempt.completed_at);
    const diffInSeconds = Math.floor((end - start) / 1000);
    return diffInSeconds;
  };

  const filteredAttempts = attempts.filter((attempt) => {
    const quiz = quizzes.find((q) => q.$id === attempt.quiz_id);
    return quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

  // Get student name/email if filtered by student
  const studentEmail = selectedStudent && attempts.length > 0 
    ? attempts[0]?.student_email || attempts[0]?.student_id 
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quiz Attempts</h1>
        <p className="text-gray-600 mt-1">
          {selectedStudent 
            ? `Quiz attempts by ${studentEmail || 'this student'}` 
            : 'Review student quiz attempts and performance'}
        </p>
        {selectedStudent && (
          <button
            onClick={() => {
              setSelectedStudent('');
              navigate(ROUTES.ADMIN.ATTEMPTS);
            }}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Clear student filter
          </button>
        )}
      </div>

      <Card className="p-4">
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

      {filteredAttempts.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No attempts found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedQuiz ? 'Try adjusting your filters' : 'No quiz attempts yet'}
          </p>
        </Card>
      ) : (
        <Card variant="elevated" className="overflow-hidden">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Quiz</Table.Head>
                <Table.Head>Student</Table.Head>
                <Table.Head>Score</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Time Spent</Table.Head>
                <Table.Head>Date</Table.Head>
                <Table.Head>Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredAttempts.map((attempt) => {
                const quiz = quizzes.find((q) => q.$id === attempt.quiz_id);
                return (
                  <Table.Row key={attempt.$id}>
                    <Table.Cell className="font-medium">{quiz?.title || 'Unknown Quiz'}</Table.Cell>
                    <Table.Cell>
                      {attempt.student_email ? (
                        <span className="text-gray-900">{attempt.student_email}</span>
                      ) : (
                        <span className="text-gray-500 italic">{attempt.student_id || 'Unknown Student'}</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-semibold text-indigo-600">
                        {attempt.points_earned !== undefined && attempt.total_points !== undefined
                          ? `${attempt.points_earned}/${attempt.total_points}`
                          : 'N/A'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>{getStatusBadge(attempt.status)}</Table.Cell>
                    <Table.Cell>
                      {formatDuration(calculateTimeSpent(attempt), 'seconds')}
                    </Table.Cell>
                    <Table.Cell>{formatDate(attempt.$createdAt)}</Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                          onClick={() => navigate(`${ROUTES.ADMIN.ATTEMPTS}/${attempt.$id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          onClick={() => setDeleteModal({ open: true, attempt })}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, attempt: null })}
        title="Delete Quiz Attempt"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this quiz attempt? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, attempt: null })}
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

export default Attempts;

